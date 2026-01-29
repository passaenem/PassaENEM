"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        if (!supabase) {
            setError("Erro de configuração: Chaves do Supabase não encontradas.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4 animate-in fade-in zoom-in-95">
            <Card className="w-full max-w-md border-slate-800 bg-card shadow-2xl">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600 shadow-lg mb-4">
                        <GraduationCap className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Questões PRO</CardTitle>
                    <CardDescription>
                        Faça login para salvar seu histórico, ver seu ranking e acessar desafios.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    
                    <Button 
                        variant="outline" 
                        className="w-full flex items-center justify-center gap-2 h-12 text-base font-medium hover:bg-slate-800 border-slate-700"
                        onClick={handleLogin}
                        disabled={loading}
                    >
                        {!loading ? (
                            <>
                                <svg className="h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                                </svg>
                                Continuar com Google
                            </>
                        ) : (
                            "Redirecionando..."
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
