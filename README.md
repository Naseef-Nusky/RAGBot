# AI DocuMate - RAG-Powered Document Chatbot

AI DocuMate is a sophisticated document chatbot that uses Retrieval-Augmented Generation (RAG) to provide intelligent responses based on uploaded documents. Users can upload PDF documents, ask questions, and receive accurate answers extracted from their documents.

## 🚀 Features

- **Document Upload**: Upload PDF documents with drag-and-drop interface
- **RAG-Powered Chat**: Ask questions and get intelligent responses based on document content
- **User Authentication**: Secure login/register system with JWT tokens
- **Document Management**: View and manage uploaded documents
- **Real-time Processing**: Documents are processed and embedded for quick retrieval
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS

## 🏗️ Architecture

This project consists of two main components:

### Backend (Node.js/Express)
- **RESTful API** with Express.js
- **MongoDB** for data storage
- **Pinecone** for vector embeddings
- **OpenAI** for text processing and chat responses
- **PDF Processing** with pdf-parse and Tesseract.js for OCR
- **Authentication** with JWT and bcrypt

### Frontend (React)
- **React 19** with modern hooks
- **Tailwind CSS** for styling
- **Axios** for API communication
- **React Markdown** for rendering responses
- **Lucide React** for icons

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** database
- **OpenAI API Key**
- **Pinecone API Key**

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone <your-repository-url>
cd RAGBot
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

## 🚀 Running the Application

### Development Mode

1. **Start the Backend Server**
```bash
cd backend
npm run dev
```
The backend will run on `http://localhost:5000`

2. **Start the Frontend Development Server**
```bash
cd frontend
npm start
```
The frontend will run on `http://localhost:3000`

### Production Mode

1. **Build the Frontend**
```bash
cd frontend
npm run build
```

2. **Start the Backend**
```bash
cd backend
npm start
```

## 📁 Project Structure

```
RAGBot/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── data/
│   │   └── embeddings.json    # Stored embeddings
│   ├── middleware/
│   │   └── auth.js            # Authentication middleware
│   ├── models/
│   │   ├── Document.js        # Document model
│   │   └── User.js            # User model
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   └── docs.js            # Document routes
│   ├── uploads/               # Uploaded files
│   ├── utils/
│   │   └── chunkText.js       # Text processing utilities
│   ├── app.js                 # Express app configuration
│   ├── server.js              # Server entry point
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AskTab.jsx     # Chat interface
│   │   │   ├── AuthForm.jsx   # Login/Register form
│   │   │   ├── DocsTab.jsx    # Document management
│   │   │   └── Updated PdfManager.jsx
│   │   ├── App.jsx            # Main app component
│   │   └── index.js
│   └── package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Documents
- `POST /upload` - Upload PDF document
- `GET /documents` - Get user's documents
- `POST /ask` - Ask question about documents
- `DELETE /documents/:id` - Delete document

## 🎯 Usage

1. **Register/Login**: Create an account or log in to access the application
2. **Upload Documents**: Drag and drop PDF files or click to browse
3. **Ask Questions**: Use the chat interface to ask questions about your documents
4. **View Responses**: Get intelligent answers based on your document content
5. **Manage Documents**: View, delete, or re-upload documents as needed

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- File upload validation
- Rate limiting (can be added)

## 🚀 Deployment

The project includes Vercel configuration for easy deployment:

```bash
# Deploy to Vercel
cd backend
npm run deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the console for error messages
2. Verify your environment variables are set correctly
3. Ensure all dependencies are installed
4. Check that MongoDB and Pinecone services are running

## 🔮 Future Enhancements

- [ ] Support for more document formats (DOCX, TXT, etc.)
- [ ] Document sharing between users
- [ ] Advanced search filters
- [ ] Export chat conversations
- [ ] Multi-language support
- [ ] Mobile app version 
