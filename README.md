# 🗂️ JSONLens — Semantic JSON Diff, Formatter & Type Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg)](https://opensource.org/licenses/MIT)
[![Live Web App](https://img.shields.io/badge/Web_App-jsonlens.grassroot.digital-06b6d4.svg)](https://jsonlens.grassroot.digital)
[![Author](https://img.shields.io/badge/Author-Rajesh_Narwal-blue.svg)](https://grassroot.digital/#about)
[![GitHub](https://img.shields.io/badge/GitHub-rjnarwal-181717.svg?logo=github)](https://github.com/rjnarwal)

**JSONLens** is a high-performance, privacy-first JSON utility for comparing large payloads with semantic key-order-independent diffing, syntax formatting, and automated TypeScript / Kotlin type generation.

---

## ✨ Features

- 🔍 **Semantic AST Diffing**: Detects additions, deletions, modifications, and type changes without false alarms caused by key reordering.
- ⚡ **Auto-Formatter & Beautifier**: Fix single quotes, trailing commas, unquoted keys, and escaped JSON strings with 1-click.
- 📐 **Instant Type Generator**: Generate type definitions for:
  - TypeScript Interfaces & Types
  - Kotlin `@Serializable` Data Classes
  - Java Jackson / Gson POJOs
  - Python Pydantic Models & TypedDict
  - Go Structs (`json:"..."`)
- 🛡️ **100% In-Memory Processing**: Zero telemetry, zero server-side parsing.

---

## 🚀 Quick Start

```bash
git clone https://github.com/rjnarwal/jsonlens.git
cd jsonlens
npm install
npm run dev
```

---

## 📄 License

MIT License © 2026 [Rajesh Narwal](https://grassroot.digital/#about)
