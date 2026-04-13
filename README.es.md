<div align="center">
  <h1>⚡ QuotaDeck AI</h1>
  <p><strong>Gestor de cuotas y cuentas para Antigravity IDE — Open Source</strong></p>

  [![Release](https://img.shields.io/github/v/release/auwus21/quotadeck-ai?color=blue)](https://github.com/auwus21/quotadeck-ai/releases)
  [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
  [![CI](https://img.shields.io/github/actions/workflow/status/auwus21/quotadeck-ai/ci.yml?label=CI)](https://github.com/auwus21/quotadeck-ai/actions)

  [English](README.md) · **Español** · [Português](README.pt.md)
</div>

---

## ✨ ¿Qué es QuotaDeck AI?

Una aplicación de escritorio **open-source** para gestionar múltiples cuentas de Antigravity AI IDE. Monitoreo de cuotas en tiempo real, cambio de cuenta con un clic, y administración completa — todo desde una interfaz premium.

### 🎯 Funcionalidades principales

| Feature | Descripción |
|---------|-------------|
| 🔄 **Cambio de cuenta** | Cambio instantáneo entre cuentas sin login/logout manual |
| 📊 **Monitor de cuotas** | Visualización en tiempo real del uso de cuotas por modelo |
| 🔐 **Seguridad** | Tokens encriptados con AES-256-GCM, almacenamiento local |
| 🌐 **Multi-idioma** | Español, English, Português |
| 📥 **Import múltiple** | OAuth, token manual, o importación desde instalación local |
| 🖥️ **System tray** | Minimizar a la bandeja, cambio rápido desde el menú |
| ⏰ **Alertas** | Notificaciones cuando la cuota está por agotarse |
| 🔄 **Backup automático** | Respaldo de credenciales antes de cada cambio |

---

## 📦 Instalación

### Descarga directa (Recomendado)

Ir a [GitHub Releases](https://github.com/auwus21/quotadeck-ai/releases) y descargar:

- **Windows**: `.msi` (recomendado) o `.exe`
- **macOS**: `.dmg` (Apple Silicon & Intel)
- **Linux**: `.deb` (Debian/Ubuntu) o `.AppImage`

---

## 🚀 Quick Start

1. **Instalar** QuotaDeck AI
2. **Agregar una cuenta** → OAuth (recomendado), Token, o Import Local
3. **Monitorear** las cuotas desde el Dashboard
4. **Cambiar** entre cuentas con un clic

---

## 🏗️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Desktop Runtime | Tauri v2 + Rust |
| Frontend | React 19 + TypeScript |
| Styling | TailwindCSS v4 |
| State | Zustand |
| Icons | Lucide React |
| i18n | react-i18next |
| Animations | Framer Motion |
| DB Local | SQLite (rusqlite) |
| HTTP | reqwest |
| Crypto | AES-256-GCM |

---

## 🛠️ Desarrollo

### Requisitos

- [Rust](https://rustup.rs/) ≥ 1.73
- [Node.js](https://nodejs.org/) ≥ 22
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (Windows)

### Setup

```bash
# Clonar el repositorio
git clone https://github.com/auwus21/quotadeck-ai.git
cd quotadeck-ai

# Instalar dependencias frontend
npm install

# Modo desarrollo
npm run tauri dev

# Build de producción
npm run tauri build
```

---

## 🔒 Seguridad y Privacidad

- **100% Local**: No requiere registro. Sin servidores propios. Sin telemetría.
- **Encriptación**: Todos los tokens se encriptan con AES-256-GCM antes de guardarse.
- **Datos locales**: Todo se almacena en `%APPDATA%/QuotaDeckAI` (Windows).
- **Open Source**: Código abierto y auditable.

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Lee la [guía de contribución](CONTRIBUTING.md) para comenzar.

```bash
# Formato de commits
feat(accounts): agregar flujo de importación OAuth
fix(quota): corregir cálculo de tiempo de reinicio
docs(readme): agregar instrucciones de instalación
```

---

## 📄 Licencia

[MIT](LICENSE) — Usalo libremente.

---

<div align="center">
  <p><strong>Hecho con ❤️ para la comunidad LATAM</strong></p>
  <p>
    <a href="https://github.com/auwus21/quotadeck-ai/issues">Reportar Bug</a> ·
    <a href="https://github.com/auwus21/quotadeck-ai/issues">Sugerir Feature</a>
  </p>
</div>
