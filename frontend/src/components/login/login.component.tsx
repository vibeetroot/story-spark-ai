import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { Link } from "react-router-dom";
import SSInput from "../ui-component/ss-input/ss-input";
import SSButton from "../ui-component/ss-button/ss-button";
import { motion } from "framer-motion";
import { useLoginUserMutation, useGoogleLoginMutation, useGithubLoginMutation } from "../../redux/apis/auth.api";
import { storeUserInfo } from "../../services/auth.service";
import RedirectComponent from "../redirect.component";
import toast, { Toaster } from "react-hot-toast";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { WandSparkles, BookOpen, UsersRound } from "lucide-react";

type Inputs = { email: string; password: string; };

const LoginComponent = () => {
  const [loginUser] = useLoginUserMutation();
  const [googleLogin] = useGoogleLoginMutation();
  const [githubLogin] = useGithubLoginMutation();
  const { register, handleSubmit, formState: { errors } } = useForm<Inputs>({ mode: "onChange" });
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    setIsBusy(true);
    try {
      const res = await loginUser({ ...data }).unwrap();
      if (res.data.accessToken) {
        toast.success("User logged in successfully!");
        storeUserInfo({ accessToken: res.data.accessToken });
        setIsLoggedIn(true);
      }
    } catch { toast.error("Login failed. Please check your credentials."); }
    finally { setIsBusy(false); }
  };

  const handleGoogleLoginSuccess = async (credentialResponse: CredentialResponse) => {
    setIsBusy(true);
    try {
      const res = await googleLogin({ token: credentialResponse.credential }).unwrap();
      if (res.data.accessToken) {
        toast.success("User logged in successfully with Google!");
        storeUserInfo({ accessToken: res.data.accessToken });
        setIsLoggedIn(true);
      }
    } catch { toast.error("Failed to login with Google. Please try again."); }
    finally { setIsBusy(false); }
  };

  const handleGoogleLoginError = () => { toast.error("Google login failed. Please try again."); };

  const handleGithubLogin = async () => {
    setIsBusy(true);
    try {
      const res = await githubLogin({}).unwrap();
      if (res.data.accessToken) {
        toast.success("User logged in successfully with GitHub!");
        storeUserInfo({ accessToken: res.data.accessToken });
        setIsLoggedIn(true);
      }
    } catch { toast.error("Failed to login with GitHub. Please try again."); }
    finally { setIsBusy(false); }
  };

  if (isLoggedIn) return <RedirectComponent defaultPath="/dashboard" />;

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 flex items-center justify-center relative overflow-hidden px-4 py-8 sm:px-6 lg:px-8 box-border">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5 }} className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5, delay: 0.2 }} className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center relative z-10 box-border">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="hidden lg:flex flex-col justify-center gap-6 w-full max-w-md mx-auto box-border">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-700 bg-clip-text text-transparent">Turns Ideas into<br />unforgettable stories</h1>
          <p className="text-slate-500 dark:text-slate-400">AI powered storytelling that helps you<br />create, connect &amp; inspire.</p>
          <div className="flex justify-center items-center gap-6 border border-gray-300 dark:border-slate-700 rounded-2xl p-4 bg-slate-50 dark:bg-slate-800 dark:text-gray-400">
            <WandSparkles className="text-violet-600 shrink-0" /><div><h2 className="font-bold">Smart writing</h2><p className="text-sm">AI that understands your ideas</p></div>
          </div>
          <div className="flex justify-center items-center gap-6 border border-gray-300 dark:border-slate-700 rounded-2xl p-4 bg-slate-50 dark:bg-slate-800 dark:text-gray-400">
            <BookOpen className="text-violet-600 shrink-0" /><div><h2 className="font-bold">Endless Creativity</h2><p className="text-sm">Stories that captivate and inspire</p></div>
          </div>
          <div className="flex justify-center items-center gap-6 border border-gray-300 dark:border-slate-700 rounded-2xl p-4 bg-slate-50 dark:bg-slate-800 dark:text-gray-400">
            <UsersRound className="text-violet-600 shrink-0" /><div><h2 className="font-bold">Built for everyone</h2><p className="text-sm">Writers, Creators and dreamers</p></div>
          </div>
        </motion.div>
        <div className="flex justify-center w-full box-border">
          <div className="w-full max-w-md bg-slate-50 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 sm:p-8 lg:p-10 shadow-2xl overflow-hidden relative mx-auto">
            <button onClick={() => (window.location.href = "/")} className="mb-4 text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200 flex items-center gap-2 cursor-pointer">Back to Home</button>
            <div className="mb-6"><h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h2><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sign in to continue your story</p></div>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <SSInput label="Email" type="email" name="email" placeholder="you@example.com" register={register} validation={{ required: "Email is required" }} error={errors.email} autoComplete="email" />
              <SSInput label="Password" type="password" name="password" placeholder="••••••••" register={register} validation={{ required: "Password is required" }} error={errors.password} autoComplete="password" />
              <div className="flex justify-end -mt-2"><Link to="/forgot-password" className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors duration-200">Forgot Password?</Link></div>
              <SSButton text="Sign In" type="submit" isLoading={isBusy} />
            </form>
            <div className="mt-6 relative w-full">
              <div className="absolute inset-0 flex items-center w-full"><div className="w-full border-t border-slate-200 dark:border-slate-700" /></div>
              <div className="relative flex justify-center text-sm"><span className="px-4 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">OR</span></div>
            </div>
            <div className="mt-4 flex flex-col gap-3 items-center w-full">
              <div className="flex justify-center w-full overflow-hidden"><GoogleLogin onSuccess={handleGoogleLoginSuccess} onError={handleGoogleLoginError} /></div>
              <button onClick={handleGithubLogin} disabled={isBusy} className="flex items-center justify-center gap-3 w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/></svg>
                Continue with GitHub
              </button>
            </div>
            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400 font-medium">Don&apos;t have an account?{" "}<Link to="/signup" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors duration-200">Sign up for free</Link></p>
          </div>
        </div>
      </div>
      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
};

export default LoginComponent;
