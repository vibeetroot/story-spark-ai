import { useForm, SubmitHandler } from "react-hook-form";
import SSInput from "../ui-component/ss-input/ss-input";
import SSButton from "../ui-component/ss-button/ss-button";
import { useState } from "react";
import {
  useLoginUserMutation,
  useGoogleLoginMutation,
} from "../../redux/apis/auth.api";
import { storeUserInfo, getUserInfo } from "../../services/auth.service";
import { USER_ROLE } from "../../constants/role";
import RedirectComponent from "../redirect.component";
import toast, { Toaster } from "react-hot-toast";
import { Link } from "react-router-dom";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";

type Inputs = {
  email: string;
  password: string;
};

const LoginComponent = () => {
  const [loginUser] = useLoginUserMutation();
  const [googleLogin] = useGoogleLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({ mode: "onChange" });

  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    setIsBusy(true);

    try {
      const res = await loginUser({ ...data }).unwrap();

      if (res.data.accessToken) {
        toast.success("User logged in successfully!");

        storeUserInfo({
          accessToken: res.data.accessToken,
        });

        setIsLoggedIn(true);
      }
    } catch {
      toast.error("Login failed. Please check your credentials.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleGoogleLoginSuccess = async (
    credentialResponse: CredentialResponse,
  ) => {
    setIsBusy(true);

    try {
      const res = await googleLogin({
        token: credentialResponse.credential,
      }).unwrap();

      if (res.data.accessToken) {
        toast.success("User logged in successfully with Google!");

        storeUserInfo({
          accessToken: res.data.accessToken,
        });

        setIsLoggedIn(true);
      }
    } catch {
      toast.error("Failed to login with Google. Please try again.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleGoogleLoginError = () => {
    toast.error("Google login failed. Please try again.");
  };

  // Role-based redirect fix
  if (isLoggedIn) {
    const userInfo = getUserInfo();

    const isDashboardUser =
      userInfo?.role === USER_ROLE.ADMIN ||
      userInfo?.role === USER_ROLE.SUPER_ADMIN;

    return (
      <RedirectComponent
        defaultPath={isDashboardUser ? "/dashboard" : "/explore"}
      />
    );
  }

  return (
    <div className="min-h-[100dvh] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex items-center justify-center relative overflow-hidden px-4 py-8">
      {" "}
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative z-10 flex w-full max-w-lg flex-col justify-center py-4 sm:py-6">
        {" "}
        <div className="mb-6 sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="text-center text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 drop-shadow-sm">
            STORY SPARK AI
          </h2>
        </div>
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/60 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
          {" "}
          <button
            onClick={() => (window.location.href = "/")}
            className="mb-5 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-500 transition-colors"
          >
            ← Back to Home
          </button>
          <h3 className="text-center text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            <p className="mt-2 mb-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Sign in to continue your creative journey.
            </p>{" "}
          </h3>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <SSInput
              label="Email address"
              name="email"
              type="email"
              placeholder="Enter your email"
              required={true}
              icon="fi fi-rr-envelope"
              register={register}
              validation={{ required: "Email is required" }}
              error={errors.email}
            />

            <SSInput
              label="Password"
              name="password"
              type="password"
              placeholder="Enter your password"
              required={true}
              icon="fi fi-rr-lock"
              register={register}
              validation={{ required: "Password is required" }}
              error={errors.password}
            />

            <div className="flex justify-end">
              <a
                href="/forgot-password"
                className="text-sm font-medium text-indigo-500 hover:text-indigo-400 transition-colors"
              >
                Forgot Password?
              </a>
            </div>

            <SSButton text="Sign In" type="submit" isLoading={isBusy} />
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>

            <div className="relative flex justify-center text-sm">
              <span className="bg-slate-50 dark:bg-slate-800 px-4 text-xs font-semibold tracking-wider uppercase text-slate-500">
                Or continue with
              </span>
            </div>
          </div>
          {/* Explicitly added list-none to prevent stray bullet point artifact on production build */}
          <div className="mt-6 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={handleGoogleLoginError}
            />
          </div>
          <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-indigo-500 hover:text-indigo-400 transition-colors"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
};

export default LoginComponent;
