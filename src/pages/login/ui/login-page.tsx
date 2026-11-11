import { useState } from "react";

import { useAppDispatch } from "@/app/store/hooks";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Smartphone } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

import { AuthFormLayout } from "@widgets/auth-layout";

import {
  getAuthErrorMessage,
  getPostAuthRedirect,
  setCredentials,
  useLoginMutation,
} from "@features/auth";

const loginSchema = z.object({
  phone: z
    .string()
    .min(1, "شماره تلفن همراه را وارد کنید.")
    .regex(/^09\d{9}$/, "شماره همراه باید با ۰۹ شروع شود و ۱۱ رقم باشد."),
  password: z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  const submitLogin = handleSubmit(async (values) => {
    try {
      const credentials = await login(values).unwrap();
      dispatch(setCredentials(credentials));
      navigate(getPostAuthRedirect(location.state), { replace: true });
    } catch (error) {
      setError("root", { message: getAuthErrorMessage(error) });
    }
  });

  const togglePasswordVisibility = () => {
    setShowPassword((isVisible) => !isVisible);
  };

  return (
    <AuthFormLayout
      title="ورود به میز کار"
      description="جهت دسترسی به پنل مدیریت لایه‌ها و موتور رفع خطای توپولوژی، وارد حساب خود شوید."
    >
      {location.state?.passwordReset === true && (
        <p
          role="status"
          className="mb-5 rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm"
        >
          رمز عبور تغییر کرد. با شماره همراه و رمز جدید وارد شوید.
        </p>
      )}
      {/* خودِ فرم لاگین */}
      <form onSubmit={submitLogin} className="flex flex-col gap-5" noValidate>
        {/* فیلد شماره تلفن */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium text-foreground/80">
            شماره تلفن همراه
          </Label>
          <div className="relative">
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground/60">
              <Smartphone className="h-4 w-4" />
            </span>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="09123456789"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "phone-error" : undefined}
              className="pr-10 pl-3 text-left font-sans h-11 tracking-widest border-border/80 bg-card/40 focus-visible:ring-primary/50"
              {...register("phone")}
            />
          </div>
          {errors.phone && (
            <p id="phone-error" className="text-xs text-destructive" role="alert">
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* flex فیلد رمز عبور */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-foreground/80">
              رمز عبور
            </Label>
            <Link
              to="/auth/forgot"
              state={location.state}
              className="text-xs text-primary hover:underline font-light"
            >
              رمز عبور را فراموش کرده‌اید؟
            </Link>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground/60">
              <Lock className="h-4 w-4" />
            </span>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              className="pr-10 pl-10 h-11 tracking-widest border-border/80 bg-card/40 focus-visible:ring-primary/50"
              {...register("password")}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              aria-label={showPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
              className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/60 hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="text-xs text-destructive" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        {errors.root && (
          <div
            className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {errors.root.message}
          </div>
        )}

        {/* دکمه ثبت فرم */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 text-base font-semibold mt-2 shadow-[0_0_20px_rgba(114,180,145,0.15)] hover:shadow-[0_0_25px_rgba(114,180,145,0.3)] transition-all"
        >
          {isLoading ? "در حال ورود..." : "ورود به حساب کاربری"}
        </Button>
      </form>

      {/* هدایت به ثبت‌نام */}
      <p className="mt-8 text-sm text-center text-muted-foreground font-light">
        حساب کاربری ندارید؟{" "}
        <Link
          to="/register"
          state={location.state}
          className="text-primary font-medium hover:underline"
        >
          ایجاد حساب کاربری جدید
        </Link>
      </p>
    </AuthFormLayout>
  );
}

export default LoginPage;
