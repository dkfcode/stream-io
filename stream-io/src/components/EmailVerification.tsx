import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { smartToast } from '../utils/toastUtils';
import { useAuth } from '../stores';

interface EmailVerificationProps {
  email: string;
  userId: string;
  onVerificationComplete: () => void;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({
  email,
  userId,
  onVerificationComplete
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const inputs = Array(6).fill(0).map(() => React.createRef<HTMLInputElement>());
  const { sendVerificationEmail } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleInput = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Move to next input
    if (value && index < 5) {
      inputs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    if (!/^\d{6}$/.test(pastedData)) return;

    const newCode = pastedData.split('');
    setCode(newCode);
    inputs[5].current?.focus();
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');
    if (verificationCode.length !== 6) {
      smartToast.error('Please enter the complete 6-digit verification code');
      return;
    }

    setIsLoading(true);
    try {
      // Call backend API to verify email
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code: verificationCode, 
          email: email 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      smartToast.success('Email verified successfully!');
      onVerificationComplete();
    } catch (error) {
      smartToast.error(error instanceof Error ? error.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsLoading(true);
    setCanResend(false);
    try {
      await sendVerificationEmail(email);
      setTimeLeft(600);
      setCode(['', '', '', '', '', '']);
      smartToast.success('New verification code sent!');
    } catch (error) {
      smartToast.error('Failed to resend verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsLoading(true);
    try {
      // Check verification status with backend
      const response = await fetch('/api/auth/verification-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (data.verified) {
        smartToast.success('Email verified!');
        onVerificationComplete();
      } else {
        smartToast.error('Email not yet verified');
      }
    } catch (error) {
      smartToast.error('Failed to check verification');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-purple-500/20 shadow-2xl">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
          <CheckCircle className="w-10 h-10 text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Verify Your Email</h2>
        <p className="text-gray-400">
          We've sent a 6-digit verification code to<br />
          <span className="text-white font-medium">{email}</span>
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex justify-center space-x-2">
          {inputs.map((ref, index) => (
            <input
              key={index}
              ref={ref}
              type="text"
              maxLength={1}
              value={code[index]}
              onChange={(e) => handleInput(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-14 text-center text-2xl font-bold bg-gray-800/50 text-white rounded-lg border border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            />
          ))}
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">
            Time remaining: {formatTime(timeLeft)}
          </span>
          <button
            onClick={handleResendVerification}
            disabled={!canResend || isLoading}
            className="text-purple-400 hover:text-purple-300 disabled:text-gray-600 flex items-center space-x-1 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Resend Code</span>
          </button>
        </div>

        <button
          onClick={handleVerify}
          disabled={code.some(c => !c) || isLoading}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Verifying...</span>
            </div>
          ) : (
            'Verify Email'
          )}
        </button>

        <div className="text-center text-sm text-gray-400 flex items-center justify-center space-x-1">
          <AlertCircle className="w-4 h-4" />
          <span>Verification code will expire in 10 minutes</span>
        </div>
      </div>
    </div>
  );
}

export default EmailVerification;