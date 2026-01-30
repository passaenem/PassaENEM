"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Upload, FileText, Loader2, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast"; // Assuming this exists, or I will remove if not found, but standard in shadcn

// Minimal Toast fallback if not exists
const useToastFallback = () => ({ toast: (props: any) => alert(props.title + ": " + props.description) });

export default function AdminOfficialExamsPage() {
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [file, setFile] = useState<File | null>(null);

    // Hooks
    // Try to rely on standard alerts if toast is missing, but let's try to be safe
    // actually, I'll just use native alert for simplicity effectively or check if I can mock it.
    // For now, I'll assume simple error handling.

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        setLoading(true);
        if (!supabase) return;
        const { data, error } = await supabase
            .from('official_exams')
            .select('*')
            .order('year', { ascending: false });

        if (error) {
            console.error(error);
            alert("Erro ao carregar provas.");
        } else {
            setExams(data || []);
        }
        setLoading(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title || !year) {
            alert("Preencha todos os campos.");
            return;
        }

        setUploading(true);
        try {
            if (!supabase) throw new Error("Supabase not initialized");

            const fileExt = file.name.split('.').pop();
            const fileName = `${year}-${title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('official-exams')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('official-exams')
                .getPublicUrl(filePath);

            // 3. Save to DB
            const { error: dbError } = await supabase
                .from('official_exams')
                .insert([{
                    title,
                    year: parseInt(year),
                    pdf_url: publicUrl
                }]);

            if (dbError) throw dbError;

            alert("Prova enviada com sucesso!");
            setTitle("");
            setFile(null);
            fetchExams();

        } catch (error: any) {
            console.error(error);
            alert("Erro ao enviar prova: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string, pdfUrl: string) => {
        if (!confirm("Tem certeza que deseja excluir esta prova?")) return;

        try {
            if (!supabase) return;

            // 1. Delete from DB
            const { error: dbError } = await supabase
                .from('official_exams')
                .delete()
                .eq('id', id);

            if (dbError) throw dbError;

            // 2. Delete from Storage (Optional - extract path from URL)
            // url format: .../storage/v1/object/public/official-exams/filename
            const path = pdfUrl.split('/official-exams/')[1];
            if (path) {
                await supabase.storage.from('official-exams').remove([path]);
            }

            setExams(exams.filter(e => e.id !== id));

        } catch (error: any) {
            console.error(error);
            alert("Erro ao excluir: " + error.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 p-6 space-y-8 text-slate-100">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                    Gestão de Provas Oficiais
                </h1>
                <Button variant="outline" onClick={() => window.location.href = '/admin'}>
                    Voltar
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Upload Form */}
                <Card className="md:col-span-1 bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-slate-100 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-violet-400" />
                            Nova Prova
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Título da Prova</Label>
                                <Input
                                    id="title"
                                    placeholder="Ex: ENEM 2023 - Dia 1"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="bg-slate-950 border-slate-700 text-slate-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="year">Ano</Label>
                                <Input
                                    id="year"
                                    type="number"
                                    value={year}
                                    onChange={e => setYear(e.target.value)}
                                    className="bg-slate-950 border-slate-700 text-slate-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="file">Arquivo da Prova (PDF)</Label>
                                <Input
                                    id="file"
                                    type="file"
                                    accept="application/pdf"
                                    onChange={handleFileChange}
                                    className="bg-slate-950 border-slate-700 text-slate-100 file:text-slate-100 file:bg-slate-800 file:border-0 file:rounded-md"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gabarito">Arquivo do Gabarito (Opcional)</Label>
                                <Input
                                    id="gabarito"
                                    type="file"
                                    accept="application/pdf"
                                    onChange={handleGabaritoChange}
                                    className="bg-slate-950 border-slate-700 text-slate-100 file:text-slate-100 file:bg-slate-800 file:border-0 file:rounded-md"
                                />
                            </div>
                            <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700" disabled={uploading}>
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Enviar Prova"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Exams List */}
                <Card className="md:col-span-2 bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-slate-100 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-400" />
                            Provas Cadastradas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                            </div>
                        ) : exams.length === 0 ? (
                            <div className="text-center p-8 text-slate-500">
                                Nenhuma prova cadastrada.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {exams.map((exam) => (
                                    <div key={exam.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 font-bold border border-slate-800">
                                                {exam.year}
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-slate-200">{exam.title}</h3>
                                                <div className="text-xs text-slate-500">Adicionado em {new Date(exam.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="icon" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => window.open(exam.pdf_url, '_blank')}>
                                                <Download className="w-4 h-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={() => handleDelete(exam.id, exam.pdf_url)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
