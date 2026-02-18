import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Building2, Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';

interface LoginFormData {
  email: string;
  password: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, company } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailConfirmationNeeded, setEmailConfirmationNeeded] = useState(false);
  const [signedUpEmail, setSignedUpEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  // Auto-redirect when user is authenticated AND company data is loaded
  useEffect(() => {
    if (!authLoading && user && company) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, company, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    setSubmitting(true);
    try {
      if (isSignUp) {
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
        // If session is null, user needs to verify their email first
        if (authData.user && !authData.session) {
          // Email confirmation required
          setEmailConfirmationNeeded(true);
          setSignedUpEmail(data.email);
          setSubmitting(false);
          return;
        }

        if (authData.user && authData.session) {
          // Auto-confirmed (no email verification needed)
          toast.success('회원가입이 완료되었습니다!');
          // useEffect will handle navigation when auth context updates
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (error) throw error;

        toast.success('로그인 성공!');
        // useEffect will handle navigation when auth context updates
        return;
      }
    } catch (error: any) {
      console.error('Auth error:', error);

      // More user-friendly error messages
      if (error.message?.includes('Email not confirmed')) {
        toast.error('이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.');
      } else if (error.message?.includes('Invalid login credentials')) {
        toast.error('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else {
        toast.error(error.message || '오류가 발생했습니다.');
      }
      setSubmitting(false);
    }
  };

  // Show loading only during initial auth check (not after user interaction)
  if (authLoading && !submitting && !emailConfirmationNeeded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm text-gray-500">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // Email confirmation screen
  if (emailConfirmationNeeded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">이메일 인증이 필요합니다</h2>
            <p className="mt-3 text-sm text-gray-600">
              <span className="font-semibold text-blue-600">{signedUpEmail}</span>
              <br />
              위 주소로 인증 이메일을 발송했습니다.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              이메일에 있는 인증 링크를 클릭하면 회원가입이 완료됩니다.
            </p>
            <div className="mt-6 space-y-3">
              <Button
                className="w-full"
                onClick={() => {
                  setEmailConfirmationNeeded(false);
                  setIsSignUp(false); // Switch to login mode
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
                인증 완료 후 로그인하기
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  try {
                    const { error } = await supabase.auth.resend({
                      type: 'signup',
                      email: signedUpEmail,
                    });
                    if (error) throw error;
                    toast.success('인증 이메일을 다시 발송했습니다.');
                  } catch (err: any) {
                    toast.error(err.message || '이메일 재발송에 실패했습니다.');
                  }
                }}
              >
                인증 이메일 다시 보내기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {isSignUp ? '회원가입' : '로그인'}
          </CardTitle>
          <p className="text-sm text-gray-600">
            {isSignUp
              ? '새 계정을 만들어 시작하세요'
              : '계정에 로그인하세요'}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
              </label>
              <Input
                type="password"
                {...register('password', {
                  required: '비밀번호를 입력해주세요',
                  minLength: {
                    value: 6,
                    message: '비밀번호는 최소 6자 이상이어야 합니다',
                  },
                })}
                placeholder="••••••••"
                className="w-full"
                disabled={submitting}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={submitting || authLoading}>
              {submitting ? '처리 중...' : isSignUp ? '회원가입' : '로그인'}
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
