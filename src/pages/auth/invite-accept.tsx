import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/db';
import { toast } from 'sonner';
import { Building2, Users, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../lib/auth-context';
import { getErrorMessage } from '../../lib/utils';

interface SignupFormData {
  email: string;
  password: string;
}

export function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, company, loading: authLoading } = useAuth();

  const [invitation, setInvitation] = useState<any>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [expired, setExpired] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<SignupFormData>();

  // Load invitation details
  useEffect(() => {
    if (!token) {
      setExpired(true);
      setLoadingInvite(false);
      return;
    }

    const loadInvitation = async () => {
      const inv = await db.getInvitationByToken(token);
      if (inv) {
        setInvitation(inv);
        setValue('email', inv.email); // Pre-fill email
      } else {
        setExpired(true);
      }
      setLoadingInvite(false);
    };

    loadInvitation();
  }, [token, setValue]);

  // If user is already logged in, try to accept the invitation directly
  useEffect(() => {
    if (!authLoading && user && invitation && !accepted && !submitting) {
      handleAcceptForLoggedInUser();
    }
  }, [authLoading, user, invitation, accepted]);

  const handleAcceptForLoggedInUser = async () => {
    if (!user || !token) return;

    setSubmitting(true);
    try {
      const { error } = await db.acceptInvitation(token, user.id);
      if (error) {
        toast.error(getErrorMessage(error));
        setSubmitting(false);
        return;
      }
      
      setAccepted(true);
      toast.success(`${invitation.companies?.name || 'Company'}에 성공적으로 참여했습니다!`);
      
      // Reload the page to refresh auth context with new company
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      toast.error(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  const onSubmit = async (data: SignupFormData) => {
    if (!token || !invitation) return;

    setSubmitting(true);
    try {
      if (isSignUp) {
        // Sign up new user — the handle_new_user trigger will check invitations
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              name: data.email.split('@')[0],
            },
          },
        });

        if (error) throw error;

        // Check if email confirmation is required
        if (authData.user && !authData.session) {
          toast.success('인증 이메일이 발송되었습니다. 이메일을 확인해주세요.');
          setSubmitting(false);
          return;
        }

        if (authData.user && authData.session) {
          setAccepted(true);
          toast.success('회원가입 및 팀 참여가 완료되었습니다!');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1500);
        }
      } else {
        // Login existing user
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (error) throw error;

        if (authData.user) {
          // Accept invitation for existing user
          const { error: acceptError } = await db.acceptInvitation(token, authData.user.id);
          if (acceptError) {
            toast.error(getErrorMessage(acceptError));
            setSubmitting(false);
            return;
          }
          setAccepted(true);
          toast.success('팀 참여가 완료되었습니다!');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1500);
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(getErrorMessage(error));
      setSubmitting(false);
    }
  };

  // Loading state
  if (loadingInvite || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm text-gray-500">초대 정보를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  // Expired or invalid
  if (expired || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-400" />
            <h2 className="mt-4 text-xl font-bold text-gray-900">초대가 만료되었거나 유효하지 않습니다</h2>
            <p className="mt-2 text-sm text-gray-600">
              이 초대 링크가 만료되었거나 이미 사용되었습니다. 관리자에게 새 초대를 요청해주세요.
            </p>
            <Button className="mt-6" onClick={() => navigate('/login')}>
              로그인 페이지로 이동
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already accepted
  if (accepted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-4 text-xl font-bold text-gray-900">팀에 성공적으로 참여했습니다!</h2>
            <p className="mt-2 text-sm text-gray-600">
              대시보드로 이동합니다...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already logged in — show accepting state
  if (user && !accepted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <div className="h-10 w-10 mx-auto animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">초대를 수락하는 중...</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show signup/login form for invitation
  const companyName = invitation.companies?.name || 'Unknown Company';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">팀 초대</CardTitle>
          <div className="mt-3 rounded-lg bg-blue-50 p-3">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">{companyName}</span>에서 초대했습니다
            </p>
            <div className="mt-1 flex items-center justify-center gap-2">
              <Badge className="bg-blue-100 text-blue-700">{invitation.role}</Badge>
              <span className="text-xs text-blue-600">{invitation.email}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-center text-sm text-gray-600">
            {isSignUp
              ? '계정을 만들고 팀에 참여하세요'
              : '기존 계정으로 로그인하여 팀에 참여하세요'}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <Input
                type="email"
                {...register('email', {
                  required: '이메일을 입력해주세요',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: '유효한 이메일 주소를 입력해주세요',
                  },
                })}
                placeholder="your@email.com"
                className="w-full"
                disabled={submitting}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <Input
                type="password"
                {...register('password', {
                  required: '비밀번호를 입력해주세요',
                  minLength: { value: 6, message: '비밀번호는 최소 6자 이상이어야 합니다' },
                })}
                placeholder="••••••••"
                className="w-full"
                disabled={submitting}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? '처리 중...' : isSignUp ? '회원가입 후 참여' : '로그인 후 참여'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-blue-600 hover:text-blue-700"
              disabled={submitting}
            >
              {isSignUp
                ? '이미 계정이 있으신가요? 로그인'
                : '계정이 없으신가요? 회원가입'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

