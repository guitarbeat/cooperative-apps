# Conflict Resolution Platform

An interactive web application designed to help co-op members work through interpersonal conflicts using a structured, evidence-based mediation process.

## 🌟 Features

### Core Functionality

- **7-Step Guided Process**: Based on ICC Austin's proven conflict mediation framework, including export-ready summaries
  - **Step 1**: Setup & Information Gathering
  - **Step 2**: Party A Individual Reflection
  - **Step 3**: Party B Individual Reflection
  - **Step 4**: Shared Discussion using the ABCDE model
  - **Step 5**: Solution Development & Possibility Exploration
  - **Step 6**: Agreement & Follow-Up Planning
  - **Step 7**: Export & Session Documentation
- **Individual Reflection**: Private spaces for each party to process thoughts and emotions
- **Shared Discussion**: ABCDE cognitive behavioral model for structured conversation
- **Solution Development**: Miracle question technique and compromise building
- **Agreement Documentation**: Action steps and follow-up planning

### Enhanced Emotion Expression

- **Draggable Valence-Arousal Chart**: Interactive emotion mapping with smooth animations
- **Emotion Word Selection**: 30+ emotion words for precise feeling identification
- **Dual Data Capture**: Separate tracking of chart positions and selected words
- **Visual Feedback**: Real-time emotion summary cards

### Professional Design

- **Co-op Branding**: Custom color palette and logo integration
- **Dark/Light Mode**: Complete theme switching with user preference storage
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Stylish Separators**: Animated gradient sections with floating titles
- **Guidance Alerts**: Clear instructions for each step of the process

### Export & Documentation
- **Professional PDF Export**: Comprehensive session summaries with proper formatting
- **JSON Data Export**: Raw data for further analysis or integration
- **Complete Records**: All inputs, emotions, and agreements captured

## 🚀 Live Demo

**Website**: [https://myqraxlm.manussite.space](https://myqraxlm.manussite.space)

## 🛠️ Technology Stack

- **Frontend**: React 19 with modern hooks
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with shadcn/ui
- **Animations**: GSAP for smooth draggable interactions
- **PDF Generation**: jsPDF with custom formatting
- **Build Tool**: Vite for fast development and optimized builds
- **Package Manager**: pnpm for efficient dependency management

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

## ⚙️ npm Proxy Warning

If you run npm scripts (for example `npm test -- --run`) and see the warning
`npm warn Unknown env config "http-proxy"`, npm is detecting the deprecated
`npm_config_http_proxy` environment variable. Set the supported proxy variables
instead to silence the warning:

```bash
# macOS/Linux shells
unset npm_config_http_proxy npm_config_https_proxy
export npm_config_proxy="$HTTP_PROXY"
export npm_config_https_proxy="$HTTPS_PROXY"
```

```powershell
# Windows PowerShell
Remove-Item Env:npm_config_http_proxy -ErrorAction SilentlyContinue
Remove-Item Env:npm_config_https_proxy -ErrorAction SilentlyContinue
$Env:npm_config_proxy = $Env:HTTP_PROXY
$Env:npm_config_https_proxy = $Env:HTTPS_PROXY
```

The application already prefers `pnpm` (see the quick start section), so you can
also run `pnpm test --run` or `pnpm run lint` to avoid invoking npm entirely.

## 🎯 Usage Guide

### For Mediators
1. **Setup & Information Gathering**: Enter party names and conflict details
2. **Party A Reflection**: Guide Party A through private reflection
3. **Party B Reflection**: Support Party B's individual processing
4. **Shared Discussion (ABCDE)**: Facilitate the joint cognitive behavioral conversation
5. **Solution Development**: Help parties explore possibilities and narrow options
6. **Agreement & Follow-Up**: Document commitments, timelines, and support needs
7. **Export & Summary**: Generate PDF or JSON records for co-op files and next steps

### For Participants
- Use both emotion expression methods for complete emotional mapping
- Take time with individual reflection before shared discussion
- Focus on "I" statements and personal experiences
- Be open to understanding the other person's perspective


## 📚 Mediation Framework

Based on ICC Austin's interpersonal conflict mediation process:

1. **Intrapersonal Processing**: Individual thoughts, feelings, and communication approaches
2. **ABCDE Model**: Activating event → Beliefs → Consequences → Disputations → Effects
3. **Solution-Focused Approach**: Miracle question and perspective-taking
4. **Collaborative Agreement**: Mutual needs identification and action planning

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).


## 🙏 Acknowledgments

- **ICC Austin** for the mediation framework and worksheets
- **Co-op Community** for feedback and testing
- **Radix UI** and **shadcn/ui** for excellent component libraries
- **GSAP** for smooth animation capabilities

## 📞 Support

For questions, issues, or suggestions:
- Open an issue on GitHub
- Contact the development team
- Review the mediation process overview in `manus-working/ConflictMediationProcessSummary(forMediators).txt`
- Explore the sample interpersonal mediation worksheet in `manus-working/Copyof1.ExampleIntpersonalConflictMediationWorksheet.txt`

---

*Built with ❤️ for cooperative communities*

