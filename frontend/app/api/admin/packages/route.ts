import { NextResponse } from 'next/server';
import { GYM_PACKAGES, GymPackage } from '@/lib/types';

// In-memory persistent store for server runtime (backed by default packages)
let currentPackages: GymPackage[] = JSON.parse(JSON.stringify(GYM_PACKAGES));
let admissionFees = {
  sole: 500,
  couple: 1000,
};

export async function GET() {
  return NextResponse.json({
    packages: currentPackages,
    admissionFees,
    totalPackages: currentPackages.length,
    updatedAt: new Date().toISOString(),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, package: updatedPkg, admissionFees: newFees, packages: bulkPackages } = body;

    // Action 1: Bulk replace or reset
    if (action === 'reset') {
      currentPackages = JSON.parse(JSON.stringify(GYM_PACKAGES));
      admissionFees = { sole: 500, couple: 1000 };
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
    }

    // Action 3: Bulk replace
    if (bulkPackages && Array.isArray(bulkPackages)) {
      currentPackages = bulkPackages;
      return NextResponse.json({
        success: true,
        message: 'Packages updated in bulk.',
        packages: currentPackages,
        admissionFees,
      });
    }

    // Action 4: Upsert single package
    if (updatedPkg && updatedPkg.id) {
      const idx = currentPackages.findIndex((p) => p.id === updatedPkg.id);
      if (idx >= 0) {
        currentPackages[idx] = {
          ...currentPackages[idx],
          ...updatedPkg,
          price: Number(updatedPkg.price),
          admissionFee: Number(updatedPkg.admissionFee ?? currentPackages[idx].admissionFee),
        };
      } else {
        // Create new package
        currentPackages.push({
          ...updatedPkg,
          price: Number(updatedPkg.price),
          admissionFee: Number(updatedPkg.admissionFee ?? 500),
          features: Array.isArray(updatedPkg.features) ? updatedPkg.features : [],
        });
      }

      return NextResponse.json({
        success: true,
        message: `Package "${updatedPkg.name}" updated successfully.`,
        package: idx >= 0 ? currentPackages[idx] : updatedPkg,
        packages: currentPackages,
        admissionFees,
      });
    }

    return NextResponse.json(
      { error: 'Missing package payload or valid action' },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to update packages' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  return POST(req);
}
