# 🌳 Git Visualizer - Interactive Repository Explorer

> **Transform your Git history into an interactive visual journey** - Explore commits, branches, and relationships like never before.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-green.svg)](https://nodejs.org/)
[![D3.js](https://img.shields.io/badge/D3.js-v7.0.0-orange.svg)](https://d3js.org/)

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/git-visualizer.git
cd git-visualizer

# Install dependencies
npm install

# Start the application
npm start

# Open your browser to http://localhost:3000
```

## ✨ Features

### 🎯 **Core Functionality**
- **📊 Dual Layouts**: Force-directed and tree visualizations
- **🔍 Interactive Nodes**: Click for detailed commit information
- **🌿 Branch Detection**: Automatic branch identification and coloring
- **📅 Date Filtering**: Dynamic slider to filter commits by time range
- **🎨 Smart Labels**: Branch names instead of cryptic hashes

### 🎮 **Interactive Features**
- **🖱️ Drag & Drop**: Move nodes in force-directed layout
- **🔎 Zoom & Pan**: Navigate through large repositories
- **📋 Info Panels**: Side panel with commit details
- **🎯 Click Actions**: Instant commit information display

### 🛠️ **Technical Features**
- **🏠 Local-First**: Works completely offline, no cloud dependencies
- **⚡ Real-time**: Dynamic graph updates and filtering
- **📱 Responsive**: Works on desktop and mobile devices
- **🎨 Dark Theme**: Professional dark interface design

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend    │    │    Backend     │    │   Git Service  │
│                │    │                │    │                │
│ • D3.js       │◄──►│ • Express.js   │◄──►│ • Git Commands │
│ • Vanilla JS   │    │ • REST API    │    │ • Child Process│
│ • CSS3        │    │ • Parser      │    │                │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 📁 Project Structure
```
git-visualizer/
├── 📂 client/                 # Frontend application
│   ├── 📄 index.html          # Main HTML structure
│   ├── 📂 styles/
│   │   └── 🎨 main.css      # Styling and animations
│   └── 📂 src/
│       ├── 📜 app.js          # Main application logic
│       └── 📊 graph.js        # D3.js visualizations
├── 📂 server/                 # Backend application
│   ├── 🚀 server.js        # Express server setup
│   ├── 🛠️ gitService.js     # Git command execution
│   ├── 📋 parser.js         # Git output parsing
│   └── 🌐 routes.js         # API endpoint definitions
└── 📦 package.json            # Dependencies and scripts
```

## 🎮 Usage Guide

### 🚀 **Getting Started**
1. **Launch Application**: Run `npm start` and open http://localhost:3000
2. **Enter Repository Path**: Input path to local Git repository
3. **Load Repository**: Click "Load Repository" to analyze
4. **Explore Visualization**: Interactive graph appears automatically

### 🎯 **Interacting with the Graph**

#### **Force-Directed Layout**
- **🖱️ Drag Nodes**: Click and drag to reposition nodes
- **👆 Click Nodes**: Quick tap shows commit info panel
- **🔍 Zoom Controls**: Use mouse wheel or zoom button
- **🔄 Reset View**: Click "Reset Zoom" to center graph

#### **Tree Layout**
- **👆 Click Nodes**: Shows commit info panel
- **📐 Hierarchical View**: Clean parent-child relationships
- **📏 Enhanced Spacing**: Better readability for large repos

### 📅 **Date Filtering**
- **🎚️ Slider Control**: Adjust to filter commits by time range
- **📊 Dynamic Updates**: Graph updates in real-time
- **📈 Range Display**: Shows current date range being filtered

### 📋 **Commit Information Panel**
- **📝 Basic Info**: Hash, author, date, branches, message
- **🔄 Instant Display**: Appears immediately on node click
- **❌ Easy Close**: Click × button to dismiss panel

## 🛠️ Development

### 🔧 **Prerequisites**
- **Node.js** >= 16.0.0
- **npm** >= 7.0.0
- **Git** >= 2.0.0 (for local repositories)

### 📦 **Installation**
```bash
# Clone repository
git clone https://github.com/yourusername/git-visualizer.git
cd git-visualizer

# Install dependencies
npm install

# Start development server
npm start

# Application runs on http://localhost:3000
```

### 🎮 **Available Scripts**
```json
{
  "start": "node server/server.js",
  "dev": "nodemon server/server.js",
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

## 🔍 API Endpoints

### 📊 **Commit Data**
```http
GET /api/commits?repoPath=<path>
```
- **Description**: Fetch all commits with branch information
- **Response**: JSON array of commit objects with metadata

### 📋 **Commit Details**
```http
GET /api/commit/:hash?repoPath=<path>
```
- **Description**: Fetch detailed information for specific commit
- **Response**: Complete commit details with file changes

### ❤️ **Health Check**
```http
GET /api/health
```
- **Description**: Verify server is running
- **Response**: Server status and timestamp

## 🎨 Customization

### 🎨 **Styling**
- **🎨 CSS Variables**: Easy color customization
- **📱 Responsive Design**: Mobile-friendly breakpoints
- **🌙 Dark Theme**: Professional dark interface

### 📊 **Visualization Settings**
- **🔧 Node Sizes**: Adjustable for different screen sizes
- **🎨 Color Schemes**: Branch-based and author-based coloring
- **📏 Layout Options**: Force and tree algorithms

### 🔧 **Configuration**
```javascript
// Graph customization options
const config = {
  nodeSize: { normal: 8, merge: 12 },
  colors: { main: '#4a9eff', merge: '#ff6b6b' },
  spacing: { horizontal: 100, vertical: 75 }
};
```

## 🐛 Troubleshooting

### ⚠️ **Common Issues**

#### **Repository Not Found**
```
Error: ENOENT: no such file or directory
```
**Solution**: Ensure the repository path is correct and accessible

#### **No Git Repository**
```
Error: Not a git repository
```
**Solution**: Navigate to a directory containing `.git` folder

#### **Empty Repository**
```
Warning: No commits found in repository
```
**Solution**: Repository has no commits - try a repository with commit history

#### **Performance Issues**
```
Warning: Large repository may load slowly
```
**Solution**: Use date filter to limit commits displayed

### 🔧 **Debug Mode**
```bash
# Enable debug logging
DEBUG=true npm start

# Check browser console for detailed logs
```

## 🤝 Contributing

### 🎯 **How to Contribute**
1. **🍴 Fork** the repository
2. **🌿 Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **💾 Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **📤 Push** to the branch (`git push origin feature/amazing-feature`)
5. **🔄 Open** a Pull Request

### 📋 **Development Guidelines**
- **🎨 Code Style**: Follow existing patterns and conventions
- **📝 Documentation**: Update README for new features
- **🧪 Testing**: Test with repositories of different sizes
- **💬 Communication**: Clear commit messages and PR descriptions

### 🎯 **Feature Ideas**
- **🔍 Search Functionality**: Find commits by message or author
- **📊 Statistics Dashboard**: Repository analytics and insights
- **🎨 Theme Switching**: Light/dark mode toggle
- **📤 Export Options**: Save visualizations as images
- **🌿 Branch Filtering**: Show/hide specific branches

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### 🎯 **MIT License Summary**
- ✅ **Commercial use** allowed
- ✅ **Modification** allowed
- ✅ **Distribution** allowed
- ✅ **Private use** allowed
- ⚠️ **Liability** no warranty
- 📋 **Must include** copyright and license notice

## 🙏 Acknowledgments

### 🌟 **Special Thanks**
- **[D3.js](https://d3js.org/)** - Amazing data visualization library
- **[Node.js](https://nodejs.org/)** - JavaScript runtime
- **[Git](https://git-scm.com/)** - Version control system
- **[Express.js](https://expressjs.com/)** - Web framework

### 🎨 **Inspiration**
- **GitHub Network Graph** - Inspiration for force-directed layout
- **GitKraken** - UI/UX design ideas
- **SourceTree** - Tree layout implementation concepts

---

## 📞 Contact & Support

### 🌐 **Get in Touch**
- **🐛 Issues**: [GitHub Issues](https://github.com/yourusername/git-visualizer/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/yourusername/git-visualizer/discussions)
- **📧 Email**: your.email@example.com

### 🌟 **Show Your Support**
- **⭐ Star** the repository if you find it useful
- **🍴 Fork** to create your own version
- **📢 Share** with others who might benefit

---

**🎉 Happy Visualizing! Transform your Git history into an interactive experience.**
