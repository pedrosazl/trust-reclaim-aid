# Configuração do App Nativo com Capacitor

## O que é Capacitor?

O Capacitor permite transformar este aplicativo web em um app nativo que pode ser instalado no Android e iOS, como se fosse baixado da Play Store ou App Store.

## Pré-requisitos

Para compilar e testar o app nativo:
- Node.js e npm instalados
- Para Android: Android Studio instalado
- Para iOS: Xcode instalado (somente em Mac)

## Passos para transformar em app nativo

### 1. Transferir projeto para seu GitHub

1. Clique em "Export to Github" no Lovable
2. Faça git pull do repositório em sua máquina local

### 2. Instalar dependências

```bash
cd <nome-do-projeto>
npm install
```

### 3. Inicializar Capacitor (IMPORTANTE)

O arquivo `capacitor.config.ts` já está configurado. Agora execute:

```bash
npx cap init
```

Quando solicitado, use:
- **App ID**: app.lovable.a9aa61f288374d78b3c9313418396a4f
- **App Name**: Sistema de Trocas

### 4. Adicionar plataformas

Para Android:
```bash
npx cap add android
```

Para iOS (somente em Mac):
```bash
npx cap add ios
```

### 5. Build do projeto web

```bash
npm run build
```

### 6. Sincronizar com plataformas nativas

```bash
npx cap sync
```

**IMPORTANTE**: Execute `npx cap sync` sempre que fizer alterações no código!

### 7. Rodar no emulador ou dispositivo

Para Android:
```bash
npx cap run android
```

Para iOS:
```bash
npx cap run ios
```

## Funcionalidades Nativas Incluídas

### GPS / Geolocalização
- ✅ Rastreamento automático de localização dos usuários
- ✅ Atualização a cada 30 segundos
- ✅ Permissões configuradas automaticamente

### Modo Offline
- ✅ Dados salvos localmente
- ✅ Sincronização automática ao reconectar

### Performance
- ✅ Otimizado para dispositivos móveis
- ✅ Cache inteligente de dados

## Testando Hot Reload

Durante o desenvolvimento, o app está configurado para conectar ao servidor de desenvolvimento:
- **URL**: https://a9aa61f2-8837-4d78-b3c9-313418396a4f.lovableproject.com

Isso significa que você pode ver mudanças em tempo real no app instalado!

## Publicando na Play Store / App Store

### Android (Play Store)

1. Gerar build de produção:
```bash
npm run build
npx cap sync
```

2. Abrir no Android Studio:
```bash
npx cap open android
```

3. No Android Studio:
   - Build > Generate Signed Bundle / APK
   - Siga o wizard para criar keystore
   - Upload do arquivo .aab para Google Play Console

### iOS (App Store)

1. Abrir no Xcode:
```bash
npx cap open ios
```

2. No Xcode:
   - Configure signing & capabilities
   - Product > Archive
   - Upload para App Store Connect

## Permissões Necessárias

O app solicita automaticamente:
- 📍 **Localização**: Para rastrear GPS dos usuários
- 📷 **Câmera**: Para tirar fotos de produtos
- 📁 **Armazenamento**: Para salvar documentos

## Troubleshooting

### Erro ao sincronizar
```bash
npx cap sync --force
```

### Limpar cache
```bash
rm -rf node_modules
npm install
npm run build
npx cap sync
```

### GPS não funciona
Verifique se as permissões estão concedidas nas configurações do dispositivo.

## Suporte

Para mais informações sobre Capacitor:
- [Documentação Oficial](https://capacitorjs.com/docs)
- [Guia Android](https://capacitorjs.com/docs/android)
- [Guia iOS](https://capacitorjs.com/docs/ios)
