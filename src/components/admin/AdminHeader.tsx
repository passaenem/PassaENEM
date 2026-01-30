import { Button } from "@/components/ui/button";
import { ShieldAlert, LogOut, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function AdminHeader() {
    const router = useRouter();

    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50 p-6 rounded-xl border border-slate-800 backdrop-blur-sm">
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-red-500/10 rounded-lg">
                        <ShieldAlert className="w-8 h-8 text-red-500" />
                    </div>
                    Painel Administrativo
                </h1>
                <p className="text-slate-400 mt-1 ml-14">
                    Centro de Comando e Inteligência Estratégica
                </p>
            </div>
            <div className="flex gap-3">
                <Button
                    variant="outline"
                    onClick={() => router.push('/admin/official-exams')}
                    className="border-violet-700 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20"
                >
                    Provas Oficiais
                </Button>
                <Button
                    variant="outline"
                    onClick={() => router.push('/dashboard')}
                    className="border-slate-700 hover:bg-slate-800 text-slate-300"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar ao App
                </Button>
            </div>
        </div>
    );
}
