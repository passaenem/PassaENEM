# 🚀 Como colocar seu projeto no ar com Vercel

Este projeto já está configurado para **Deploy Contínuo**. Isso significa que toda vez que eu enviar uma atualização para o GitHub, o seu site será atualizado automaticamente.

Para ativar isso, você precisa fazer uma configuração única na Vercel:

## Passo a Passo

1.  **Crie uma conta na Vercel**
    *   Acesse [vercel.com](https://vercel.com/signup)
    *   Escolha **"Continue with GitHub"** e faça login com sua conta `passaenem`.

2.  **Importe o Projeto**
    *   No painel da Vercel, clique em **"Add New..."** -> **"Project"**.
    *   Você verá uma lista dos seus repositórios do GitHub.
    *   Encontre o **`passaenem/PassaENEM`** e clique em **"Import"**.

3.  **Configuração (Automática)**
    *   A Vercel vai detectar que é um projeto Next.js.
    *   **Não precisa mudar nada** nas configurações de build.
    *   Apenas clique em **"Deploy"**.

4.  **Pronto!**
    *   Aguarde cerca de 1 a 2 minutos.
    *   Você receberá um link (ex: `passaenem.vercel.app`) onde seu sistema estará rodando ao vivo para todo o mundo.

---

## 🔄 Como funcionam as atualizações?

A partir de agora, **você não precisa fazer mais nada** na Vercel.

*   Sempre que eu (a IA) fizer uma alteração e confirmar com você ("Vou subir pro GitHub"), a Vercel vai pegar essa alteração e atualizar o site sozinha.
*   Se houver algum erro, eu receberei o aviso pelo GitHub Actions que configurei.
