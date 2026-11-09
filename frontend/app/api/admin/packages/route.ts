import { NextRequest, NextResponse } from 'next/server';
import { GYM_PACKAGES, GymPackage } from '@/lib/types';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabase/server';

let currentPackages: GymPackage[] = JSON.parse(JSON.stringify(GYM_PACKAGES));
let admissionFees = {
  sole: 500,
  couple: 1000,
};

function mapDbToGymPackage(pkg: any): GymPackage {
  const type: 'sole' | 'couple' | 'coaching' =
    pkg.category === 'couple' ? 'couple' : pkg.category === 'coaching' ? 'coaching' : 'sole';

  let duration: '1_month' | '3_months' | '6_months' | '1_year' | '90_days' = '1_month';
  if (pkg.duration_type === '3m') duration = '3_months';
  else if (pkg.duration_type === '6m') duration = '6_months';
  else if (pkg.duration_type === '1y') duration = '1_year';
  else if (pkg.duration_type === 'coaching') duration = '90_days';

  let durationLabel = '1 Month';
  if (duration === '3_months') durationLabel = '3 Months';
  else if (duration === '6_months') durationLabel = '6 Months';
  else if (duration === '1_year') durationLabel = '1 Year';
  else if (duration === '90_days') durationLabel = '12-Week Transformation Cohort';

  return {
    id: pkg.id,
    type,
    duration,
    durationLabel,
    name: pkg.name,
    price: Number(pkg.price),
    admissionFee: Number(pkg.admission_fee) || 0,
    features: Array.isArray(pkg.features) ? pkg.features : [],
    popular: Boolean(pkg.popular),
  };
}

function mapGymPackageToDb(p: GymPackage) {
  const category = p.type;
  let durationType = '1m';
  if (p.duration === '3_months') durationType = '3m';
  else if (p.duration === '6_months') durationType = '6m';
  else if (p.duration === '1_year') durationType = '1y';
  else if (p.duration === '90_days') durationType = 'coaching';

  return {
    id: p.id,
    name: p.name,
    category,
    duration_type: durationType,
    price: p.price,
    admission_fee: p.admissionFee || (category === 'couple' ? 1000 : category === 'coaching' ? 0 : 500),
    description: p.durationLabel || '',
    features: p.features || [],
    popular: Boolean(p.popular),
    active: true,
    updated_at: new Date().toISOString(),
  };
}

export async function GET() {
  let packagesList = currentPackages;
  let fees = admissionFees;

  if (isServerSupabaseConfigured && supabaseServer) {
    try {
      const { data, error } = await supabaseServer
        .from('gym_packages')
        .select('*')
        .eq('active', true)
        .order('id', { ascending: true });

      if (!error && data && data.length > 0) {
        packagesList = data
          .filter((pkg: any) => !pkg.id.endsWith('_adm'))
          .map(mapDbToGymPackage);

        const soleAdm = data.find((p: any) => p.id === 'sole_adm');
        const coupleAdm = data.find((p: any) => p.id === 'couple_adm');
        fees = {
          sole: soleAdm ? Number(soleAdm.price) : 500,
          couple: coupleAdm ? Number(coupleAdm.price) : 1000,
        };

        currentPackages = packagesList;
        admissionFees = fees;
      }
    } catch (sbErr) {
      console.warn('Supabase packages fetch failed, falling back to cache:', sbErr);
    }
  }

  return NextResponse.json({
    packages: packagesList,
    admissionFees: fees,
    source: isServerSupabaseConfigured ? 'supabase' : 'cache',
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, package: updatedPkg, admissionFees: newFees, packages: bulkPackages } = body;

    // Action 1: Reset to default rate card
    if (action === 'reset') {
      currentPackages = JSON.parse(JSON.stringify(GYM_PACKAGES));
      admissionFees = { sole: 500, couple: 1000 };

      if (isServerSupabaseConfigured && supabaseServer) {
        try {
          const payload = currentPackages.map(mapGymPackageToDb);
          await supabaseServer.from('gym_packages').upsert(payload, { onConflict: 'id' });
        } catch (sbErr) {
          console.warn('Supabase reset failed:', sbErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'All gym packages reset to default official rate card.',
        packages: currentPackages,
        admissionFees,
      });
    }

    // Action 2: Update Admission Fees
    if (newFees) {
      if (typeof newFees.sole === 'number') admissionFees.sole = newFees.sole;
      if (typeof newFees.couple === 'number') admissionFees.couple = newFees.couple;

      if (isServerSupabaseConfigured && supabaseServer) {
        try {
          if (typeof newFees.sole === 'number') {
            await supabaseServer
              .from('gym_packages')
              .update({ price: newFees.sole, admission_fee: newFees.sole })
              .eq('id', 'sole_adm');
          }
          if (typeof newFees.couple === 'number') {
            await supabaseServer
              .from('gym_packages')
              .update({ price: newFees.couple, admission_fee: newFees.couple })
              .eq('id', 'couple_adm');
          }
        } catch (sbErr) {
          console.warn('Supabase admission update failed:', sbErr);
        }
      }
    }

    // Action 3: Bulk Replace
    if (bulkPackages && Array.isArray(bulkPackages)) {
      currentPackages = bulkPackages;

      if (isServerSupabaseConfigured && supabaseServer) {
        try {
          const payload = currentPackages.map(mapGymPackageToDb);
          await supabaseServer.from('gym_packages').upsert(payload, { onConflict: 'id' });
        } catch (sbErr) {
          console.warn('Supabase bulk upsert failed:', sbErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Packages updated in bulk.',
        packages: currentPackages,
        admissionFees,
      });
    }

    // Action 4: Update single package
    if (updatedPkg && updatedPkg.id) {
      const idx = currentPackages.findIndex((p) => p.id === updatedPkg.id);
      if (idx !== -1) {
        currentPackages[idx] = {
          ...currentPackages[idx],
          ...updatedPkg,
          price: Number(updatedPkg.price),
          admissionFee:
            updatedPkg.admissionFee !== undefined ? Number(updatedPkg.admissionFee) : currentPackages[idx].admissionFee,
        };

        if (isServerSupabaseConfigured && supabaseServer) {
          try {
            const dbPayload = mapGymPackageToDb(currentPackages[idx]);
            await supabaseServer.from('gym_packages').upsert(dbPayload, { onConflict: 'id' });
          } catch (sbErr) {
            console.warn('Supabase package update failed:', sbErr);
          }
        }

        return NextResponse.json({
          success: true,
          message: `Package ${updatedPkg.name} updated successfully.`,
          package: currentPackages[idx],
          packages: currentPackages,
          admissionFees,
        });
      }
    }

    return NextResponse.json({
      success: true,
      packages: currentPackages,
      admissionFees,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update packages' },
      { status: 500 }
    );
  }
}
