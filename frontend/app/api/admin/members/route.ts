import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/lib/services/admin-service';
import { AuthService } from '@/lib/services/auth-service';
import { PaymentService } from '@/lib/services/payment-service';
import {
  supabaseServer,
  isServerSupabaseConfigured,
  resolveServerUser,
} from '@/lib/supabase/server';
import { db } from '@/lib/db/mock-db';
import { UserStatus } from '@/lib/types';
import { SmsService } from '@/lib/services/sms-service';

function inferPackageType(tier: string): 'sole' | 'couple' | 'coaching' {
  if (tier.startsWith('couple')) return 'couple';
  if (tier === 'coaching_90' || tier === 'burnzone') return 'coaching';
  return 'sole';
}

function getDefaultDurationDays(tier: string): number {
  if (tier === 'sole_1y' || tier === 'couple_1y') return 365;
  if (tier === 'sole_6m' || tier === 'couple_6m') return 180;
  if (tier === 'sole_3m' || tier === 'couple_3m' || tier === 'coaching_90') return 90;
  if (tier === 'none') return 0;
  return 30;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');
    const adminUser = await resolveServerUser(adminId);

    if (adminUser.role !== 'admin' && adminUser.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden: Administrative access required.' }, { status: 403 });
    }

    const nowIso = new Date().toISOString();

    if (isServerSupabaseConfigured && supabaseServer) {
      try {
        // Automatic 90-day & fixed-term plan expiration sweep: deactivate expired active clients
        await supabaseServer
          .from('profiles')
          .update({ status: 'expired', updated_at: nowIso })
          .eq('role', 'client')
          .eq('status', 'active')
          .not('membership_expires_at', 'is', null)
          .lt('membership_expires_at', nowIso);

        const { data: profiles, error } = await supabaseServer
          .from('profiles')
          .select('*')
          .order('joined_at', { ascending: false });

        if (!error && profiles) {
          const members = profiles.map((p: any) => ({
            id: p.id,
            email: p.email,
            name: p.name,
            role: p.role,
            tier: p.tier || 'none',
            packageId: p.package_id,
            packageName: p.package_name,
            packageType: p.package_type,
            status: p.status,
            avatarUrl: p.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            assignedInstructorId: p.assigned_instructor_id,
            assignedInstructorName: p.assigned_instructor_name,
            membershipExpiresAt: p.membership_expires_at,
            joinedAt: p.joined_at,
            phone: p.phone,
          }));

          return NextResponse.json({
            members,
            total: members.length,
            source: 'supabase',
          });
        }
      } catch (sbErr) {
        console.warn('Supabase members fetch error, using cache:', sbErr);
      }
    }

    // Fallback: sync mock expirations too
    for (const u of db.users) {
      if (u.role === 'client' && u.status === 'active' && u.membershipExpiresAt) {
        if (new Date(u.membershipExpiresAt).getTime() <= Date.now()) {
          u.status = 'expired';
        }
      }
    }

    const members = AdminService.getAllMembers(adminUser);
    return NextResponse.json({
      members,
      total: members.length,
      source: 'cache',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');
    const adminUser = await resolveServerUser(adminId);

    if (adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only administrators can add members.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      email,
      password,
      phone,
      role = 'client',
      tier = 'sole_1m',
      status = 'active',
      durationDays,
    } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Please enter the member full name (min 2 characters).' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();
    const safeRole = role === 'instructor' || role === 'admin' ? role : 'client';
    const safeStatus: UserStatus =
      status === 'pending' || status === 'suspended' || status === 'expired' ? status : 'active';
    const selectedTier = tier || 'sole_1m';

    const priceInfo = PaymentService.getTierPrice(selectedTier);
    const pkgType = inferPackageType(selectedTier);
    const validDays =
      typeof durationDays === 'number' && durationDays > 0
        ? durationDays
        : safeStatus === 'pending' || selectedTier === 'none'
        ? 0
        : getDefaultDurationDays(selectedTier);

    const nowIso = new Date().toISOString();
    const expiresAt =
      validDays > 0 ? new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString() : null;

    let userId = `usr_${Date.now()}`;
    let createdMember: any = null;

    if (isServerSupabaseConfigured && supabaseServer) {
      const { data: existingProfile } = await supabaseServer
        .from('profiles')
        .select('id')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (existingProfile) {
        return NextResponse.json(
          { error: 'An account with this email already exists.' },
          { status: 409 }
        );
      }

      const { data: authData, error: authErr } = await supabaseServer.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: {
          name: cleanName,
          role: safeRole,
          phone: phone?.trim() || null,
          tier: selectedTier,
        },
      });

      if (authErr && authErr.message?.toLowerCase().includes('already')) {
        return NextResponse.json(
          { error: 'An account with this email already exists in authentication records.' },
          { status: 409 }
        );
      }

      if (authData?.user?.id) {
        userId = authData.user.id;
      }

      // Resolve real head coach profile ID so assigned_instructor_id satisfies PostgreSQL FK
      let defaultCoachId: string | null = null;
      if (safeRole === 'client') {
        try {
          const { data: headCoach } = await supabaseServer
            .from('profiles')
            .select('id')
            .in('role', ['admin', 'instructor'])
            .limit(1)
            .maybeSingle();
          defaultCoachId = headCoach?.id || null;
        } catch (_) {}
      }

      const profilePayload = {
        id: userId,
        email: cleanEmail,
        name: cleanName,
        phone: phone?.trim() || null,
        role: safeRole,
        tier: safeStatus === 'pending' && selectedTier === 'none' ? 'none' : selectedTier,
        package_id: selectedTier !== 'none' ? selectedTier : null,
        package_name: selectedTier !== 'none' ? priceInfo.name : 'No Active Plan',
        package_type: pkgType,
        status: safeStatus,
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        assigned_instructor_id: defaultCoachId,
        assigned_instructor_name: safeRole === 'client' ? 'Adeesha Kumarasingha (Founder & Head Coach)' : null,
        membership_expires_at: expiresAt,
        joined_at: nowIso,
        updated_at: nowIso,
      };

      const { data: inserted, error: profErr } = await supabaseServer
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'email' })
        .select('*')
        .single();

      if (profErr) {
        return NextResponse.json({ error: `Failed to create member profile: ${profErr.message}` }, { status: 400 });
      }

      createdMember = {
        id: String(inserted.id),
        email: inserted.email,
        name: inserted.name,
        role: inserted.role,
        tier: inserted.tier,
        packageId: inserted.package_id,
        packageName: inserted.package_name,
        packageType: inserted.package_type,
        status: inserted.status,
        avatarUrl: inserted.avatar_url,
        assignedInstructorId: inserted.assigned_instructor_id,
        assignedInstructorName: inserted.assigned_instructor_name,
        membershipExpiresAt: inserted.membership_expires_at,
        joinedAt: inserted.joined_at,
        phone: inserted.phone,
      };

      try {
        await supabaseServer.from('audit_logs').insert({
          actor_id: adminUser.id.includes('-') ? adminUser.id : null,
          actor_email: adminUser.email || 'adeesha@musclecraft.lk',
          action: 'ADMIN_MEMBER_CREATED',
          target_type: 'user',
          target_id: createdMember.id,
          details: `Admin created ${safeRole} account for ${cleanName} (${cleanEmail}) [Plan: ${createdMember.packageName}, Status: ${safeStatus}].`,
        });
      } catch (_) {}
    }

    const syncedLocal = AuthService.registerUser({
      id: userId,
      name: cleanName,
      email: cleanEmail,
      password,
      phone: phone?.trim() || undefined,
      role: safeRole,
      tier: selectedTier,
      packageName: selectedTier !== 'none' ? priceInfo.name : 'No Active Plan',
      packageType: pkgType,
      status: safeStatus,
      membershipExpiresAt: expiresAt || undefined,
    });

    AuthService.setPassword(cleanEmail, password);

    // Automatic SMS Notification: Admin Created Member with Credentials
    if (phone) {
      try {
        await SmsService.notifyAdminCreatedMember({
          phone,
          name: cleanName,
          email: cleanEmail,
          password,
        });
      } catch (smsErr) {
        console.warn('Admin member creation SMS dispatch warning:', smsErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        member: createdMember || syncedLocal,
        message: `Member ${cleanName} added with login access (${safeStatus.toUpperCase()}).`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add member.' }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');
    const adminUser = await resolveServerUser(adminId);

    if (adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only administrators can update member access.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      memberId,
      action,
      status,
      name,
      email,
      phone,
      role,
      tier,
      packageName,
      membershipExpiresAt,
      instructorId,
      assignedInstructorName,
      newPassword,
      extendDays,
      reason,
    } = body;

    if (!memberId) {
      return NextResponse.json({ error: 'Missing memberId' }, { status: 400 });
    }

    const isSelf = memberId === adminUser.id;
    let resolvedStatus: UserStatus | undefined = status;
    if (action === 'ban') resolvedStatus = 'suspended';
    if (action === 'unban' || action === 'activate') resolvedStatus = 'active';

    if (isSelf && resolvedStatus && resolvedStatus !== 'active') {
      return NextResponse.json({ error: 'Cannot suspend or deactivate your own administrator account.' }, { status: 400 });
    }
    if (isSelf && role && role !== 'admin') {
      return NextResponse.json({ error: 'Cannot demote your own administrator role.' }, { status: 400 });
    }

    if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
      return NextResponse.json({ error: 'Full name must be at least 2 characters.' }, { status: 400 });
    }
    if (email !== undefined && (typeof email !== 'string' || !email.includes('@'))) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }
    if (newPassword !== undefined && newPassword !== '' && (typeof newPassword !== 'string' || newPassword.length < 6)) {
      return NextResponse.json({ error: 'New password must be at least 6 characters.' }, { status: 400 });
    }

    const updatePayload: any = { updated_at: new Date().toISOString() };
    let newExpiryIso: string | undefined = undefined;
    let memberName = 'member';
    const changedFields: string[] = [];

    if (isServerSupabaseConfigured && supabaseServer) {
      const { data: currentProfile } = await supabaseServer
        .from('profiles')
        .select('*')
        .eq('id', memberId)
        .maybeSingle();

      if (currentProfile) {
        memberName = currentProfile.name;

        // Editable identity fields
        if (name !== undefined && name.trim() !== currentProfile.name) {
          updatePayload.name = name.trim();
          memberName = name.trim();
          changedFields.push(`Name: ${name.trim()}`);
        }

        if (email !== undefined) {
          const cleanEmail = email.toLowerCase().trim();
          if (cleanEmail !== (currentProfile.email || '').toLowerCase()) {
            const { data: emailConflict } = await supabaseServer
              .from('profiles')
              .select('id')
              .ilike('email', cleanEmail)
              .neq('id', memberId)
              .maybeSingle();

            if (emailConflict) {
              return NextResponse.json(
                { error: 'Another member is already registered with this email address.' },
                { status: 409 }
              );
            }
            updatePayload.email = cleanEmail;
            changedFields.push(`Email: ${cleanEmail}`);
          }
        }

        if (phone !== undefined) {
          const cleanPhone = typeof phone === 'string' && phone.trim() ? phone.trim() : null;
          if (cleanPhone !== (currentProfile.phone || null)) {
            updatePayload.phone = cleanPhone;
            changedFields.push(`Phone: ${cleanPhone || 'Cleared'}`);
          }
        }

        if (role !== undefined && ['client', 'instructor', 'admin'].includes(role) && role !== currentProfile.role) {
          updatePayload.role = role;
          changedFields.push(`Role: ${role}`);
        }

        // Editable tier / package
        if (tier !== undefined && typeof tier === 'string' && tier !== currentProfile.tier) {
          const priceInfo = PaymentService.getTierPrice(tier);
          updatePayload.tier = tier;
          updatePayload.package_id = tier !== 'none' ? tier : null;
          updatePayload.package_name =
            packageName?.trim() || (tier !== 'none' ? priceInfo.name : 'No Active Plan');
          updatePayload.package_type = inferPackageType(tier);
          changedFields.push(`Plan: ${updatePayload.package_name}`);
        } else if (packageName !== undefined && packageName.trim() !== currentProfile.package_name) {
          updatePayload.package_name = packageName.trim();
          changedFields.push(`Plan Name: ${packageName.trim()}`);
        }

        // Explicit expiration date override from Edit Modal (only log if date actually changed)
        if (membershipExpiresAt !== undefined) {
          if (membershipExpiresAt === null || membershipExpiresAt === '') {
            if (currentProfile.membership_expires_at !== null) {
              updatePayload.membership_expires_at = null;
              changedFields.push('Expiry: Cleared');
            }
          } else {
            const parsedDate = new Date(membershipExpiresAt);
            const curDateStr = currentProfile.membership_expires_at
              ? String(currentProfile.membership_expires_at).slice(0, 10)
              : '';
            const nextDateStr = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString().slice(0, 10) : '';
            if (nextDateStr && nextDateStr !== curDateStr) {
              updatePayload.membership_expires_at = parsedDate.toISOString();
              changedFields.push(`Expiry: ${nextDateStr}`);
            }
          }
        }

        // Quick +N days extension
        if (extendDays && Number(extendDays) > 0) {
          const currentExp = currentProfile.membership_expires_at
            ? new Date(currentProfile.membership_expires_at).getTime()
            : 0;
          const baseTime = currentExp > Date.now() ? currentExp : Date.now();
          newExpiryIso = new Date(baseTime + Number(extendDays) * 24 * 60 * 60 * 1000).toISOString();
          updatePayload.membership_expires_at = newExpiryIso;
          updatePayload.status = 'active';
          if (!currentProfile.tier || currentProfile.tier === 'none') {
            updatePayload.tier = Number(extendDays) >= 90 ? 'coaching_90' : 'sole_1m';
            updatePayload.package_id = updatePayload.tier;
            updatePayload.package_name = PaymentService.getTierPrice(updatePayload.tier).name;
          }
        } else if (resolvedStatus) {
          updatePayload.status = resolvedStatus;
          if (resolvedStatus !== currentProfile.status) {
            changedFields.push(`Status: ${resolvedStatus}`);
          }
          // When unbanning / activating an expired or unassigned client (without explicit expiry override), ensure valid package & future expiry
          if (resolvedStatus === 'active' && membershipExpiresAt === undefined && action !== 'edit') {
            const curExp = currentProfile.membership_expires_at
              ? new Date(currentProfile.membership_expires_at).getTime()
              : 0;
            if (!currentProfile.membership_expires_at || curExp <= Date.now()) {
              const fallbackDays = getDefaultDurationDays(tier || currentProfile.tier || 'sole_1m') || 30;
              newExpiryIso = new Date(Date.now() + fallbackDays * 24 * 60 * 60 * 1000).toISOString();
              updatePayload.membership_expires_at = newExpiryIso;
            }
            if (!currentProfile.tier || currentProfile.tier === 'none') {
              const targetTier = tier || 'sole_1m';
              updatePayload.tier = targetTier;
              updatePayload.package_id = targetTier;
              updatePayload.package_name = PaymentService.getTierPrice(targetTier).name;
            }
          }
        }

        // Assigned coach update (supports clearing to null too)
        if (instructorId !== undefined) {
          const cleanCoachId = instructorId && String(instructorId).trim() ? String(instructorId).trim() : null;
          updatePayload.assigned_instructor_id = cleanCoachId;
          if (assignedInstructorName !== undefined) {
            updatePayload.assigned_instructor_name = assignedInstructorName || null;
          } else if (cleanCoachId) {
            const { data: coachRow } = await supabaseServer
              .from('profiles')
              .select('name')
              .eq('id', cleanCoachId)
              .maybeSingle();
            if (coachRow?.name) updatePayload.assigned_instructor_name = coachRow.name;
          } else {
            updatePayload.assigned_instructor_name = null;
          }
          changedFields.push(`Coach: ${updatePayload.assigned_instructor_name || 'Default'}`);
        } else if (assignedInstructorName !== undefined) {
          updatePayload.assigned_instructor_name = assignedInstructorName || null;
        }

        // Sync email / password with Supabase Auth if modified
        if (updatePayload.email || (newPassword && newPassword.trim().length >= 6)) {
          try {
            const authUpdate: any = {};
            if (updatePayload.email) {
              authUpdate.email = updatePayload.email;
              authUpdate.email_confirm = true;
            }
            if (newPassword && newPassword.trim().length >= 6) {
              authUpdate.password = newPassword.trim();
              changedFields.push('Password: Reset');
            }
            await supabaseServer.auth.admin.updateUserById(memberId, authUpdate);
          } catch (authUpdErr) {
            console.warn('Supabase auth admin update note:', authUpdErr);
          }
          if (newPassword && newPassword.trim().length >= 6) {
            AuthService.setPassword(updatePayload.email || currentProfile.email, newPassword.trim());
          }
        }

        const { data: updatedProf, error: updErr } = await supabaseServer
          .from('profiles')
          .update(updatePayload)
          .eq('id', memberId)
          .select('*')
          .single();

        if (updErr) {
          return NextResponse.json({ error: updErr.message }, { status: 400 });
        }

        // Update local mock cache if present
        const localMatch = db.users.find((u) => u.id === memberId);
        if (localMatch) {
          if (updatePayload.name) localMatch.name = updatePayload.name;
          if (updatePayload.email) localMatch.email = updatePayload.email;
          if (updatePayload.phone !== undefined) localMatch.phone = updatePayload.phone || undefined;
          if (updatePayload.role) localMatch.role = updatePayload.role;
          if (updatePayload.status) localMatch.status = updatePayload.status;
          if (updatePayload.membership_expires_at !== undefined) {
            localMatch.membershipExpiresAt = updatePayload.membership_expires_at || undefined;
          }
          if (updatePayload.tier) localMatch.tier = updatePayload.tier;
          if (updatePayload.package_name) localMatch.packageName = updatePayload.package_name;
          if (updatePayload.package_type) localMatch.packageType = updatePayload.package_type;
          if (updatePayload.assigned_instructor_id !== undefined) {
            localMatch.assignedInstructorId = updatePayload.assigned_instructor_id || undefined;
          }
          if (updatePayload.assigned_instructor_name !== undefined) {
            localMatch.assignedInstructorName = updatePayload.assigned_instructor_name || undefined;
          }
        }

        const auditAction = extendDays
          ? 'MEMBERSHIP_EXTENDED'
          : action === 'edit' || changedFields.length > 1
          ? 'ADMIN_MEMBER_UPDATED'
          : `MEMBER_STATUS_${(updatePayload.status || 'updated').toUpperCase()}`;

        const auditDetails = extendDays
          ? `Extended membership for ${memberName} by +${extendDays} days.`
          : action === 'edit' || changedFields.length > 0
          ? `Admin updated ${memberName} (${changedFields.join(', ') || 'details saved'}).`
          : `Admin updated ${memberName} status to ${updatePayload.status}.${reason ? ` Note: ${reason}` : ''}`;

        try {
          await supabaseServer.from('audit_logs').insert({
            actor_id: adminUser.id.includes('-') ? adminUser.id : null,
            actor_email: adminUser.email || 'adeesha@musclecraft.lk',
            action: auditAction,
            target_type: 'user',
            target_id: memberId,
            details: auditDetails,
          });
        } catch (_) {}

        return NextResponse.json({
          success: true,
          member: {
            id: updatedProf.id,
            name: updatedProf.name,
            email: updatedProf.email,
            phone: updatedProf.phone,
            role: updatedProf.role,
            tier: updatedProf.tier,
            packageId: updatedProf.package_id,
            packageName: updatedProf.package_name,
            packageType: updatedProf.package_type,
            status: updatedProf.status,
            assignedInstructorId: updatedProf.assigned_instructor_id,
            assignedInstructorName: updatedProf.assigned_instructor_name,
            membershipExpiresAt: updatedProf.membership_expires_at,
            joinedAt: updatedProf.joined_at,
            avatarUrl: updatedProf.avatar_url,
          },
        });
      }
    }

    // Fallback to AdminService (local mock DB)
    const localUser = db.users.find((u) => u.id === memberId);
    if (localUser && action === 'edit') {
      if (name) localUser.name = name.trim();
      if (email) localUser.email = email.toLowerCase().trim();
      if (phone !== undefined) localUser.phone = phone?.trim() || undefined;
      if (role) localUser.role = role;
      if (resolvedStatus) localUser.status = resolvedStatus;
      if (tier) {
        localUser.tier = tier;
        localUser.packageType = inferPackageType(tier);
        localUser.packageName = packageName || (tier !== 'none' ? PaymentService.getTierPrice(tier).name : 'No Active Plan');
      }
      if (membershipExpiresAt !== undefined) {
        localUser.membershipExpiresAt = membershipExpiresAt || undefined;
      }
      if (newPassword && newPassword.trim().length >= 6) {
        AuthService.setPassword(localUser.email, newPassword.trim());
      }
      return NextResponse.json({ success: true, member: localUser });
    }

    let updatedMember = null;
    if (extendDays) {
      updatedMember = AdminService.extendMembership(adminUser, memberId, Number(extendDays));
    } else if (resolvedStatus) {
      updatedMember = AdminService.updateMemberStatus(adminUser, memberId, resolvedStatus, reason);
    } else if (instructorId) {
      updatedMember = AdminService.assignInstructor(adminUser, memberId, instructorId);
    }

    return NextResponse.json({ success: true, member: updatedMember });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
