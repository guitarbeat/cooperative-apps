# House Love - Cooperative Community Platform

A React-based web application designed to empower cooperative communities by providing tools for conflict mediation, resource sharing, and community building.

## 🏠 About

House Love connects cooperative housing communities with:
- **Conflict Mediators**: Find qualified mediators for community disputes
- **Resource Sharing**: Share and discover community resources
- **Community Building**: Tools and resources for sustainable cooperative living
- **Training Materials**: Comprehensive training resources for cooperative housing trustees on culture development and conflict resolution

## 🚀 Features

- **Interactive Homepage** with animated text and engaging UX
- **Mediator Directory** with map and contact info
- **Resource Library** with filters and cards
- **Contact System** via EmailJS
- **Interactive Map** using Leaflet + React Leaflet
- **Responsive Design** with SCSS
- **Theme Toggle** for light and dark modes
- **Training Materials**: Comprehensive documentation, worksheets, case studies, and interactive tools for cooperative housing culture and conflict resolution

## 🛠️ Tech Stack

- **Runtime**: Node.js 22.x
- **Frontend**: React 18.3.1, React DOM 18.3.1
- **Routing**: React Router DOM 6.17.0
- **Styling**: SCSS (`sass` 1.69.4)
- **Maps**: Leaflet 1.9.4 with React Leaflet 4.2.1
- **Email**: EmailJS `@emailjs/browser` 3.11.0
- **Icons**: FontAwesome 6.4.x
- **Animations**: GSAP 3.12.x, Animate.css 4.1.1
- **Build**: Create React App (`react-scripts` 5.0.1)

## ⚡ Quickstart

> Requires Node.js 22.x. If you use `nvm`, run `nvm use` to switch versions.

1. Clone and install
   ```bash
   git clone <repository-url>
   cd house-love
   npm install
   ```
2. Configure environment
   ```bash
   cp .env.example .env.local
   # then edit .env.local and fill in values
   ```
3. Start the app
   ```bash
   npm start
   ```
4. Open `http://localhost:3000`

## 🔑 Configuration (Environment Variables)

Create `.env.local` with the following variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_EMAILJS_PUBLIC_KEY` | EmailJS public key | Yes |
| `REACT_APP_EMAILJS_SERVICE_ID` | EmailJS service ID | Yes |
| `REACT_APP_EMAILJS_TEMPLATE_ID` | EmailJS template ID | Yes |

See `.env.example` for a template. CRA automatically loads `.env.local`.

## 📁 Project Structure

```
src/
├── components/
│   ├── About/
│   ├── AnimatedLetters/
│   ├── Contact/
│   ├── Home/
│   ├── Layout/
│   ├── Mediators/
│   └── Resources/
├── assets/
├── App.js
├── App.scss
├── index.js
└── ...
docs/
├── activities/          # Role-playing scenarios and facilitator guides
├── workbook/           # Training worksheets and case studies
│   ├── case_studies/
│   └── worksheets/
└── training/           # Additional training materials
resources/
└── policy_templates/   # Customizable policy templates
public/
└── training-tools/     # Interactive web-based training tools
```

## 🧪 Scripts

- `npm start` — Run the app in development
- `npm test` — Run tests (Jest + React Testing Library)
- `npm run build` — Build for production
- `npm run eject` — Eject CRA (one-way)

## 🚀 Deployment

### Netlify
1. Connect the repository
2. Build command: `npm run build`
3. Publish directory: `build`
4. Set environment variables in Netlify UI

### Vercel
1. Install CLI: `npm i -g vercel`
2. Run `vercel`
3. Add environment variables in the project settings

## 🔒 Security Notes

- Never commit secrets. `.env*` files are gitignored; keep `.env.example` only.
- Set all EmailJS variables in env. The code supports env overrides and should not rely on any default IDs or keys in production.
- Use HTTPS in production and keep dependencies updated.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/name`
3. Commit: `git commit -m "feat: add X"`
4. Push: `git push origin feature/name`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License — see the `LICENSE` file.

## 📚 Training Materials

This repository includes comprehensive training materials for cooperative housing trustees:

- **Training Activities** (`/docs/activities/`): Role-playing scenarios and facilitator guides for hands-on learning
- **Workbook Materials** (`/docs/workbook/`): Worksheets and case studies for individual and group exercises
- **Policy Templates** (`/resources/policy_templates/`): Customizable templates for cooperative policies
- **Interactive Tools** (`/public/training-tools/`): Web-based interactive tools for conflict resolution, communication assessment, and policy development

### Accessing Training Materials

- **Web Tools**: Navigate to `/training-tools/index.html` in your browser after starting the development server, or access via `http://localhost:3000/training-tools/index.html`
- **Documentation**: All markdown files in `/docs/` can be viewed directly or integrated into your documentation system
- **Resources**: Policy templates are available in `/resources/policy_templates/` for customization

## 🆘 Support

For support, use the website's contact form or open an issue.

---

Built with ❤️ for cooperative communities.
