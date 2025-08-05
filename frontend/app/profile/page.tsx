'use client';

import type React from 'react';

import { Navbar } from '@/components/navbar';
import { PrivateRoute } from '@/components/private-route';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { profileService, vehicleService } from '@/services/api';
import {
  AlertTriangle,
  Calendar,
  Loader2,
  Shield,
  Trash2,
  User
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface ProfileData {
  name: string;
  email: string;
  createdAt: string;
}

function ProfileContent() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [clearingVehicles, setClearingVehicles] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const { user, signout } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await profileService.getProfile();
      setProfile(data);
      setFormData({
        name: data.name,
        email: data.email
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to load profile',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setErrors({});

    try {
      const updatedProfile = await profileService.updateProfile(formData);
      setProfile(updatedProfile);
      toast({
        title: 'Profile updated',
        description: 'Profil bilgileriniz kaydedildi.'
      });
    } catch (err: any) {
      setErrors({ profile: err.message || 'Failed to update profile' });
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    setErrors({});

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrors({ password: 'New passwords do not match' });
      setChangingPassword(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setErrors({ password: 'Yeni şifre en az 6 karakter olmalıdır' });
      setChangingPassword(false);
      return;
    }

    try {
      await profileService.changePassword(
        passwordData.oldPassword,
        passwordData.newPassword
      );
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      toast({
        title: 'Password changed',
        description: 'Şifreniz başarıyla güncellendi.'
      });
    } catch (err: any) {
      setErrors({ password: err.message || 'Failed to change password' });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleClearVehicles = async () => {
    if (
      !confirm(
        'Are you sure you want to delete all your saved vehicles? This action cannot be undone.'
      )
    ) {
      return;
    }

    setClearingVehicles(true);
    try {
      await vehicleService.clearAllVehicles();
      toast({
        title: 'Vehicles cleared',
        description: 'Tüm kayıtlı araçlarınız silindi.'
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to clear vehicles',
        variant: 'destructive'
      });
    } finally {
      setClearingVehicles(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt(
      'This will permanently delete your account and all data. Type "DELETE" to confirm:'
    );

    if (confirmation !== 'DELETE') {
      return;
    }

    setDeletingAccount(true);
    try {
      await profileService.deleteAccount();
      toast({
        title: 'Account deleted',
        description: 'Hesabınız kalıcı olarak silindi.'
      });
      signout();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete account',
        variant: 'destructive'
      });
    } finally {
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Failed to load profile information</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profil Ayarları</h1>
        <p className="text-gray-600 mt-1">
          Hesap bilgilerinizi ve tercihlerinizi yönetin
        </p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Kişisel Bilgiler
          </CardTitle>
          <CardDescription>
            Temel hesap bilgilerinizi güncelleyin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {errors.profile && (
              <Alert variant="destructive">
                <AlertDescription>{errors.profile}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Ad Soyad</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e =>
                  setFormData(prev => ({ ...prev, email: e.target.value }))
                }
                required
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>
                Üye tarihi:{' '}
                {new Date(profile.createdAt).toLocaleDateString('tr-TR')}
              </span>
            </div>

            <Button type="submit" disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Güncelleniyor...
                </>
              ) : (
                'Profili Güncelle'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {errors.password && (
              <Alert variant="destructive">
                <AlertDescription>{errors.password}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="oldPassword">Current Password</Label>
              <Input
                id="oldPassword"
                type="password"
                value={passwordData.oldPassword}
                onChange={e =>
                  setPasswordData(prev => ({
                    ...prev,
                    oldPassword: e.target.value
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={e =>
                  setPasswordData(prev => ({
                    ...prev,
                    newPassword: e.target.value
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={e =>
                  setPasswordData(prev => ({
                    ...prev,
                    confirmPassword: e.target.value
                  }))
                }
                required
              />
            </div>

            <Button type="submit" disabled={changingPassword}>
              {changingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
            <div>
              <h3 className="font-medium">Clear All Vehicles</h3>
              <p className="text-sm text-gray-600">
                Delete all saved vehicles from your dashboard
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleClearVehicles}
              disabled={clearingVehicles}
              className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
            >
              {clearingVehicles ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </>
              )}
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
            <div>
              <h3 className="font-medium">Delete Account</h3>
              <p className="text-sm text-gray-600">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
            >
              {deletingAccount ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <PrivateRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <ProfileContent />
        </main>
      </div>
    </PrivateRoute>
  );
}
