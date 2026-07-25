import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { IoArrowBackOutline } from 'react-icons/io5'
import { Link } from 'react-router-dom'

import { signinSchema, type SigninFormValues } from '../types/common/signinSchema'
import OAuthProviders from '../components/common/OAuthProviders'
import InputGroup from '../components/common/InputGroup'
import AuthService from '../services/AuthService'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/common/Button'
import AuthPanel from '../components/common/AuthPanel'
import { FaCheck } from 'react-icons/fa6'

const Login = () => {
  const [rememberAccount, setRememberAccount] = useState<boolean>(false)
  const { refresh, setAuth } = useAuth()
  const { register, handleSubmit, formState, setError, reset } = useForm<SigninFormValues>({
    resolver: zodResolver(signinSchema),
    mode: "onTouched"
  })
  const { errors, isDirty, isValid, isSubmitting, isSubmitSuccessful } = formState

  const onSubmit: SubmitHandler<SigninFormValues> = async ({ email, password }) => {
    const [data, err] = await AuthService.signin({ email, password })

    if (!data && err) {
      setError('email', {
        type: "server",
        message: err.startsWith("User already exists.") ? "User already exists." : err,
      })

      if (err == "Email verification required") {
        setAuth({
          id: "",
          createdAt: new Date(),
          updatedAt: new Date(),
          email: email,
          emailVerified: false,
          name: "",
        })
        await AuthService.resendVerifyEmailOTP({ email })
      }

      return
    }


    setAuth(data?.user)
  }

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset()
      refresh()
    }
  }, [isSubmitSuccessful, reset])

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row md:justify-start bg-white">
      <div className="auth-form-container md:flex-shrink-0 md:justify-start">
        <Link to='/' className="mb-4 text-gray-500 text-sm cursor-pointer flex items-center hover:underline w-fit">
          <IoArrowBackOutline className="mr-2" />
          Back to Home
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-left pb-2 sm:pb-4 text-midtone">Sign in to your account</h1>

        <OAuthProviders mode="login" />

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-gray-500 bg-white">OR</span>
          </div>
        </div>

        <form className='flex flex-col gap-3' onSubmit={handleSubmit(onSubmit)}>
          <InputGroup
            type='email'
            label='Email'
            placeholder='Enter your email'
            error={errors.email?.message}
            {...register("email")}
          />
          <InputGroup
            type='password'
            label='Password'
            placeholder='Enter your password'
            error={errors.password?.message}
            {...register("password")}
          />

          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2'>
            <label className='text-xs flex gap-2 items-center'>
              <input
                className='peer'
                type="checkbox"
                checked={rememberAccount}
                onChange={(e) => setRememberAccount(e.target.checked)}
                hidden
              />
              <div className='border w-3.5 aspect-square rounded-sm border-gray-300 flex justify-center items-center cursor-pointer peer-checked:bg-accent'>
                {rememberAccount && <FaCheck color='#fff' size={8} />}
              </div>
              <p>
                Remember me
              </p>
            </label>
            <Link to={'/forgot-password'} className='text-xs hover:underline'>Forgot Password?</Link>
          </div>

          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!isDirty || !isValid}
          >
            Sign in
          </Button>
        </form>
        <p className='text-xs text-center py-2'>
          Don't have an account?{" "}
          <Link to="/signup" className='font-semibold hover:underline'>Sign up</Link>
        </p>
      </div>
      <AuthPanel variant="login" />
    </div>
  )
}

export default Login