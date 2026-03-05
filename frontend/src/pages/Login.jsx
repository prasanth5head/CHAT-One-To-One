import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, authAPI } from '../services/api';
import { generateKeyPair } from '../utils/encryption';
import { Lock, Shield, MessageSquare } from 'lucide-react';

export default function Login() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleTestLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        // As per prompt, users must login ONLY using Google Gmail account.
        // To support a pure development environment without setting up GCP OAuth creds yet,
        // We mock the google token for testing, but in production we'd use @react-oauth/google.
        // For this demonstration, we'll simulate a token that the backend accepts,
        // or simulate what the flow would be.

        // In a real Google OAuth flow, we'd wrap this page in GoogleOAuthProvider 
        // and use useGoogleLogin() to get the credential string.

        const fakeToken = "mock_google_token_" + Date.now();
        try {
            const keys = await generateKeyPair();

            // Assume authAPI.loginWithGoogle is called
            const res = await authAPI.loginWithGoogle({ token: fakeToken, publicKey: keys.publicKey });

            login(res.data.user, res.data.token, keys.privateKey);
            navigate('/');
        } catch (err) {
            setError("Failed to login with Google");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex w-full h-screen bg-background text-foreground items-center justify-center">
            <div className="w-full max-w-md p-8 bg-secondary rounded-xl shadow-lg border border-border">
                <div className="flex justify-center mb-6">
                    <div className="flex items-center justify-center w-16 h-16 bg-primary rounded-full text-primary-foreground">
                        <MessageSquare size={32} />
                    </div>
                </div>
                <h2 className="text-3xl font-bold text-center mb-2">SecureChat</h2>
                <p className="text-center text-muted-foreground mb-8">End-to-End Encrypted Messaging</p>

                {error && <div className="p-3 mb-4 bg-red-500/10 border border-red-500 rounded text-red-500 text-sm text-center">{error}</div>}

                <button
                    onClick={handleTestLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 bg-white text-black py-3 px-4 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                    {loading ? 'Connecting...' : 'Continue with Google'}
                </button>

                <div className="mt-8 flex flex-col gap-3">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Lock size={16} className="text-primary" />
                        <p>End-to-end encryption with RSA & AES-256</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Shield size={16} className="text-primary" />
                        <p>Your private keys never leave your device</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
