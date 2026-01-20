import React, { useState, useEffect, useRef } from 'react';
import { Heart, Camera, Book, Mail, Trash2, X, Plus, ChevronLeft, ChevronRight, PenTool, Save, Calendar, Upload, LogIn, UserPlus, LogOut, User, Link, Copy, Check, Edit2, Search, Coffee, StickyNote } from 'lucide-react';

/**
 * STORY OF US - Single File React Application
 * * UPDATES:
 * - RESPONSIVE DESIGN: Optimized font sizes (text-4xl md:text-5xl) and padding for mobile vs desktop.
 * - Navigation: Bottom on Mobile, Top on Desktop.
 * - Grids: 1 col on mobile, up to 4 on desktop.
 * - Session Persistence: Remembers login.
 * - IndexedDB: Handles large files.
 */

// --- IndexedDB Helper (Handles Large Data) ---
const DB_NAME = 'StoryOfUsDB';
const DB_VERSION = 1;

const dbActions = {
  // Initialize DB
  init: () => {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('polaroids')) {
          db.createObjectStore('polaroids', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('diary_books')) {
          db.createObjectStore('diary_books', { keyPath: 'id' });
        }
      };
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  },

  // Get All Items
  getAll: async (storeName) => {
    const db = await dbActions.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  // Add/Update Item
  put: async (storeName, item) => {
    const db = await dbActions.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  // Delete Item
  delete: async (storeName, id) => {
    const db = await dbActions.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
};


// --- Components ---

const Navigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', icon: Heart, label: 'Home' },
    { id: 'wall', icon: Camera, label: 'Memories' },
    { id: 'letters', icon: Mail, label: 'Letters' },
    { id: 'diary', icon: Book, label: 'Diary' },
  ];

  return (
    // RESPONSIVE NAV: bottom-0 on mobile, top-0 on desktop (md:top-0)
    <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-auto bg-white/90 backdrop-blur-md border-t md:border-b md:border-t-0 border-rose-100 px-6 py-3 flex justify-around items-center z-40 shadow-lg transition-all">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${
            activeTab === tab.id ? 'text-rose-500 scale-110' : 'text-gray-400 hover:text-rose-300'
          }`}
        >
          <tab.icon size={24} fill={activeTab === tab.id ? "currentColor" : "none"} />
          <span className="text-xs font-medium">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

// --- HOME PAGE & AUTH ---
const HomePage = ({ onNavigate, onLogin, onLogout, user }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [linkHandle, setLinkHandle] = useState('');
  const [exploreTarget, setExploreTarget] = useState('');

  useEffect(() => {
    if (user && !linkHandle) {
        setLinkHandle(user.username.toLowerCase().replace(/\s+/g, '-'));
    }
    const params = new URLSearchParams(window.location.search);
    const storyUser = params.get('story');
    if (storyUser) {
        setExploreTarget(storyUser);
    }
  }, [user]);

  const handleAuth = (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    const storedUser = localStorage.getItem('app_user');
    const userData = storedUser ? JSON.parse(storedUser) : null;

    if (isLoginMode) {
      if (userData && userData.username === username && userData.password === password) {
        onLogin(userData);
      } else {
        setError('Invalid username or password');
      }
    } else {
      if (userData) {
         if (userData.username === username) {
            setError('User already exists. Please login.');
            return;
         }
         if (!window.confirm("An account already exists. Overwrite it?")) return;
      }
      const newUser = { username, password };
      localStorage.setItem('app_user', JSON.stringify(newUser));
      onLogin(newUser);
    }
  };

  const copyGuestLink = () => {
    const baseUrl = window.location.href.split('?')[0];
    const customLink = `${baseUrl}?story=${linkHandle}`;
    
    const copyFallback = (text) => {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        } else {
           setError('Could not copy link manually.');
        }
      } catch (err) {
        setError('Could not copy link.');
      }
    };
    
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(customLink)
            .then(() => {
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            })
            .catch(() => copyFallback(customLink));
    } else {
        copyFallback(customLink);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-20 md:pt-28 bg-gradient-to-br from-rose-50 to-orange-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full animate-fade-in-up">
        <div className="mb-8 relative inline-block">
          <div className="absolute inset-0 bg-rose-200 blur-2xl opacity-50 rounded-full animate-pulse"></div>
          <Heart size={80} className="text-rose-500 relative z-10 mx-auto drop-shadow-xl" fill="currentColor" />
        </div>
        
        {/* RESPONSIVE FONT: text-4xl on mobile, text-5xl on desktop */}
        <h1 className="text-4xl md:text-5xl font-serif text-gray-800 mb-8 tracking-tight">Here to Us</h1>

        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-sm border border-rose-100 mb-8 w-full">
          {user ? (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-2 text-rose-500">
                <User size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-serif text-gray-800">Welcome, {user.username}</h2>
                <p className="text-gray-500 text-sm">You are logged in as Owner.</p>
              </div>

              <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 text-left">
                <div className="flex items-center gap-2 mb-2 text-rose-700 font-medium">
                    <Link size={16} />
                    <span className="text-sm">Create & Share Link</span>
                </div>
                
                <p className="text-xs text-gray-500 mb-2">Customize your personal link below:</p>
                <div className="flex items-center gap-0 mb-3 relative group">
                    <div className="bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg px-3 py-2 text-xs text-gray-500 font-mono hidden sm:block">
                        [app.com/](https://app.com/)
                    </div>
                    <input 
                        type="text" 
                        value={linkHandle}
                        onChange={(e) => setLinkHandle(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                        className="flex-1 bg-white border border-gray-300 rounded-lg sm:rounded-l-none focus:ring-1 focus:ring-rose-400 focus:border-rose-400 outline-none px-3 py-2 text-sm text-rose-600 font-medium placeholder-rose-300"
                        placeholder="your-custom-name"
                    />
                    <Edit2 size={12} className="absolute right-3 text-gray-400 pointer-events-none" />
                </div>
                <button 
                    onClick={copyGuestLink}
                    className={`w-full py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                        copySuccess ? 'bg-green-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-rose-300 hover:text-rose-600'
                    }`}
                >
                    {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                    {copySuccess ? 'Link Copied!' : 'Copy Custom Link'}
                </button>
                {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
              </div>

              <button 
                onClick={onLogout}
                className="w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-serif text-gray-800 mb-6">
                {isLoginMode ? 'Owner Login' : 'Create Account'}
              </h2>
              <form onSubmit={handleAuth} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Username</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-3 bg-white border border-rose-100 rounded-lg focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 bg-white border border-rose-100 rounded-lg focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
                    placeholder="Enter password"
                  />
                </div>
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <button 
                  type="submit"
                  className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {isLoginMode ? <LogIn size={18} /> : <UserPlus size={18} />}
                  {isLoginMode ? 'Login' : 'Create Account'}
                </button>
              </form>
              <div className="mt-6 pt-6 border-t border-rose-100">
                <button 
                  onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }}
                  className="text-sm text-gray-500 hover:text-rose-500 underline decoration-rose-200 underline-offset-4"
                >
                  {isLoginMode ? "Don't have an account? Sign up" : "Already have an account? Login"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* EXPLORE / SEARCH SECTION */}
        <div className="w-full border-t border-rose-100 pt-8 mt-4">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Find a Space</h3>
            
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3.5 text-rose-300" size={16} />
                    <input 
                        type="text" 
                        placeholder="Enter username to explore..." 
                        className="w-full pl-10 pr-4 py-3 bg-white border border-rose-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200 text-sm text-gray-700 placeholder-gray-400"
                        value={exploreTarget}
                        onChange={(e) => setExploreTarget(e.target.value)}
                    />
                </div>
            </form>
            
            {exploreTarget && (
                <div className="mb-6 p-4 bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-100 rounded-xl text-rose-800 text-sm flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2 shadow-sm">
                    <span>✨ You are exploring <strong>{exploreTarget}</strong>'s world</span>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => onNavigate('wall')} className="p-4 bg-white rounded-xl shadow-sm hover:shadow-md hover:bg-rose-50 transition-all border border-rose-100 group">
                <Camera className="mx-auto mb-2 text-rose-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-gray-700">Memories</span>
              </button>
              <button onClick={() => onNavigate('diary')} className="p-4 bg-white rounded-xl shadow-sm hover:shadow-md hover:bg-rose-50 transition-all border border-rose-100 group">
                <Book className="mx-auto mb-2 text-rose-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-gray-700">Diary</span>
              </button>
            </div>

            {/* BUY ME A COFFEE LINK */}
            <div className="mt-12 text-center">
                <a 
                  href="[https://www.buymeacoffee.com/renmiaw](https://www.buymeacoffee.com/renmiaw)" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-amber-900 rounded-full font-bold text-sm transition-transform hover:scale-105 shadow-md"
                >
                   <Coffee size={18} strokeWidth={2.5} />
                   Buy Me a Coffee!
                </a>
            </div>

        </div>
      </div>
    </div>
  );
};

// --- LOVE WALL ---
const LoveWall = ({ isOwner }) => {
  const [items, setItems] = useState([]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState({ text: '', color: 'bg-yellow-200' });
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Load from IDB
    const loadItems = async () => {
      try {
        const storedItems = await dbActions.getAll('polaroids');
        setItems(storedItems.sort((a, b) => b.id - a.id));
      } catch (err) {
        console.error('Failed to load items', err);
      }
    };
    loadItems();
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newItem = {
          id: Date.now(),
          type: 'photo',
          image: reader.result,
          caption: 'New Memory',
          rotation: Math.random() * 6 - 3,
        };
        try {
          await dbActions.put('polaroids', newItem);
          setItems(prev => [newItem, ...prev]);
        } catch (err) {
          alert("Failed to save image. It might be too large.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddNote = async () => {
    if(!newNote.text.trim()) return;
    const newItem = {
        id: Date.now(),
        type: 'note',
        text: newNote.text,
        color: newNote.color,
        rotation: Math.random() * 6 - 3,
    };
    try {
        await dbActions.put('polaroids', newItem);
        setItems(prev => [newItem, ...prev]);
        setIsAddingNote(false);
        setNewNote({ text: '', color: 'bg-yellow-200' });
    } catch(err) {
        console.error("Failed to add note", err);
    }
  };

  const deleteItem = async (id) => {
    if(window.confirm("Delete this memory?")) {
        try {
          await dbActions.delete('polaroids', id);
          setItems(prev => prev.filter(p => p.id !== id));
        } catch (err) {
          console.error('Failed to delete', err);
        }
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-24 md:pt-32 px-4 sm:px-8 bg-[#FAF9F6]">
      <div className="max-w-6xl mx-auto">
        
        {/* ADD BUTTONS - Visible to Everyone */}
        <div className="flex flex-wrap justify-end gap-3 mb-8">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <button 
              onClick={() => setIsAddingNote(true)}
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-amber-900 px-6 py-3 rounded-full shadow-lg transition-all transform hover:scale-105 font-medium"
            >
              <StickyNote size={20} />
              <span>Add Note</span>
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-full shadow-lg transition-all transform hover:scale-105 font-medium"
            >
              <Plus size={20} />
              <span>Add Polaroid</span>
            </button>
        </div>

        {/* Note Input Modal */}
        {isAddingNote && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <div className={`w-full max-w-sm p-6 rounded-xl shadow-2xl transition-colors duration-300 ${newNote.color} relative`}>
                    <button onClick={() => setIsAddingNote(false)} className="absolute top-2 right-2 text-black/50 hover:text-black">
                        <X size={20} />
                    </button>
                    <h3 className="text-lg font-handwriting font-bold mb-4 text-black/80">New Sticky Note</h3>
                    <textarea 
                        className="w-full h-32 bg-transparent border-none resize-none focus:ring-0 text-lg font-handwriting text-gray-800 placeholder-black/30"
                        placeholder="Write something..."
                        value={newNote.text}
                        onChange={(e) => setNewNote({...newNote, text: e.target.value})}
                    />
                    <div className="flex gap-2 mt-4 mb-6">
                        {['bg-yellow-200', 'bg-pink-200', 'bg-blue-200', 'bg-green-200'].map(color => (
                            <button 
                                key={color}
                                onClick={() => setNewNote({...newNote, color})}
                                className={`w-6 h-6 rounded-full border border-black/10 ${color} ${newNote.color === color ? 'ring-2 ring-black/50' : ''}`}
                            />
                        ))}
                    </div>
                    <button 
                        onClick={handleAddNote}
                        className="w-full bg-black/10 hover:bg-black/20 text-black font-bold py-2 rounded-lg transition-colors"
                    >
                        Post Note
                    </button>
                </div>
            </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-20 opacity-40">
            <Camera size={64} className="mx-auto mb-4 text-gray-300" />
            <p className="text-xl font-serif text-gray-400">
              Share a photo or note to start the wall...
            </p>
          </div>
        ) : (
          /* RESPONSIVE GRID: 1 col (mobile) -> 2 col (small) -> 3 col (med) -> 4 col (lg) */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {items.map((item) => (
              <div 
                key={item.id}
                className={`group relative p-4 shadow-md hover:shadow-xl transition-all duration-300 transform hover:z-10 hover:scale-105 ${item.type === 'note' ? item.color : 'bg-white pt-4 pb-12'}`}
                style={{ transform: `rotate(${item.rotation}deg)` }}
              >
                {item.type === 'photo' ? (
                    <>
                        <div className="aspect-square bg-gray-100 mb-4 overflow-hidden relative">
                        <img src={item.image} alt="Memory" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </div>
                        <div className="text-center font-handwriting text-gray-600 text-lg">
                        {new Date(item.id).toLocaleDateString()}
                        </div>
                    </>
                ) : (
                    <div className="aspect-square flex flex-col p-2">
                        <div className="flex-1 font-handwriting text-2xl text-gray-800 leading-relaxed overflow-y-auto custom-scrollbar">
                            {item.text}
                        </div>
                    </div>
                )}
                
                <button 
                  onClick={() => deleteItem(item.id)}
                  className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- LETTERS PAGE ---
const LettersPage = ({ isOwner }) => {
  const [letters, setLetters] = useState([]);
  const [isWriting, setIsWriting] = useState(false);
  const [newLetter, setNewLetter] = useState({ title: '', content: '' });
  const [viewingLetter, setViewingLetter] = useState(null);

  useEffect(() => {
    // Letters can remain in localStorage as they are text-only and small
    const saved = localStorage.getItem('saved_letters');
    if (saved) setLetters(JSON.parse(saved));
  }, []);

  const saveLetters = (updatedLetters) => {
    setLetters(updatedLetters);
    localStorage.setItem('saved_letters', JSON.stringify(updatedLetters));
  };

  const handleSave = () => {
    if (!newLetter.title || !newLetter.content) return;
    const letter = {
      id: Date.now(),
      ...newLetter,
      date: new Date().toLocaleDateString()
    };
    saveLetters([letter, ...letters]);
    setIsWriting(false);
    setNewLetter({ title: '', content: '' });
  };

  const deleteLetter = (e, id) => {
    e.stopPropagation();
    if(window.confirm("Are you sure you want to delete this letter?")) {
        const updated = letters.filter(l => l.id !== id);
        saveLetters(updated);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-24 md:pt-32 px-4 bg-stone-50">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-serif text-stone-800">My Letters</h2>
          {isOwner && (
            <button 
              onClick={() => setIsWriting(true)}
              className="bg-stone-800 text-white px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-stone-700 transition-colors shadow-md"
            >
              <PenTool size={18} />
              Write
            </button>
          )}
        </div>

        <div className="space-y-4">
          {letters.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-stone-200 rounded-xl">
                <p className="text-stone-400">
                  {isOwner ? "No letters yet. Write something sweet." : "No letters shared yet."}
                </p>
            </div>
          ) : (
            letters.map((letter) => (
              <div 
                key={letter.id}
                onClick={() => setViewingLetter(letter)}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-stone-100 group relative"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-serif text-stone-800 mb-1">{letter.title}</h3>
                    <p className="text-stone-400 text-sm flex items-center gap-1">
                        <Calendar size={12} /> {letter.date}
                    </p>
                  </div>
                  <Mail className="text-rose-200" />
                </div>
                <p className="text-stone-500 mt-4 line-clamp-2 font-light">{letter.content}</p>
                
                {/* Delete Button - ALWAYS VISIBLE if Owner */}
                {isOwner && (
                  <button
                      onClick={(e) => deleteLetter(e, letter.id)}
                      className="absolute bottom-4 right-4 p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                      title="Delete Letter"
                  >
                      <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {isWriting && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-serif text-stone-800">New Letter</h3>
                <button onClick={() => setIsWriting(false)} className="text-stone-400 hover:text-stone-600"><X /></button>
              </div>
              <input
                type="text"
                placeholder="Title (e.g., Thinking of you)"
                className="w-full mb-4 p-3 border-b-2 border-stone-100 focus:border-rose-300 outline-none text-lg font-serif bg-transparent"
                value={newLetter.title}
                onChange={e => setNewLetter({...newLetter, title: e.target.value})}
              />
              <textarea
                placeholder="Write your heart out..."
                className="w-full h-64 p-4 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-rose-200 resize-none font-light leading-relaxed"
                value={newLetter.content}
                onChange={e => setNewLetter({...newLetter, content: e.target.value})}
              />
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={handleSave}
                  className="bg-rose-500 text-white px-8 py-3 rounded-full hover:bg-rose-600 shadow-lg flex items-center gap-2"
                >
                  <Save size={18} /> Save Letter
                </button>
              </div>
            </div>
          </div>
        )}

        {viewingLetter && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setViewingLetter(null)}>
            <div className="bg-[#fffdf7] w-full max-w-lg rounded shadow-2xl p-8 md:p-12 relative max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
               <button onClick={() => setViewingLetter(null)} className="absolute top-4 right-4 text-stone-300 hover:text-stone-500"><X /></button>
               <div className="text-center mb-8 border-b border-stone-100 pb-4">
                  <p className="text-stone-400 text-xs uppercase tracking-widest mb-2">{viewingLetter.date}</p>
                  <h3 className="text-3xl font-serif text-stone-800">{viewingLetter.title}</h3>
               </div>
               <div className="prose prose-stone font-serif leading-loose text-stone-700 whitespace-pre-line">
                  {viewingLetter.content}
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- DIARY & READER ---
const BookReader = ({ book, onClose }) => {
  if (book.type === 'pdf') {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-stone-900/95 backdrop-blur-sm p-4 animate-in fade-in duration-300">
        <div className="w-full max-w-5xl h-[85vh] bg-stone-800 rounded-lg shadow-2xl overflow-hidden flex flex-col relative z-10">
            <div className="bg-stone-800 p-3 border-b border-stone-700 flex justify-between items-center text-stone-300 px-6">
                <span className="font-medium truncate">{book.title}</span>
                <span className="text-xs uppercase tracking-wider opacity-60">PDF Viewer</span>
            </div>
            <object data={book.content} type="application/pdf" className="w-full h-full">
                <div className="flex flex-col items-center justify-center h-full text-stone-400 gap-4">
                    <p>Unable to display PDF directly.</p>
                    <a href={book.content} download className="bg-rose-600 text-white px-4 py-2 rounded">Download PDF</a>
                </div>
            </object>
        </div>
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-full z-50 cursor-pointer"
        >
          <X size={24} />
        </button>
      </div>
    );
  }

  const FlipBook = () => {
    const [currentPage, setCurrentPage] = useState(0);
    const pages = book.pages || [];
    const displayPages = pages.length % 2 === 0 ? pages : [...pages, { content: "", type: 'empty' }];

    const turnPage = (direction) => {
      if (direction === 'next' && currentPage < displayPages.length - 2) {
        setCurrentPage(curr => curr + 2);
      } else if (direction === 'prev' && currentPage > 0) {
        setCurrentPage(curr => curr - 2);
      }
    };

    const canGoNext = currentPage < displayPages.length - 2;
    const canGoPrev = currentPage > 0;

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-50 cursor-pointer"
        >
          <X size={32} />
        </button>

        <div className="relative flex items-center gap-2 md:gap-4 w-full max-w-5xl justify-center z-10">
          <button 
            onClick={() => turnPage('prev')}
            disabled={!canGoPrev}
            className={`relative z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer ${!canGoPrev ? 'opacity-20 cursor-not-allowed' : 'opacity-100'}`}
          >
            <ChevronLeft size={32} />
          </button>

          <div className="perspective-1000 relative flex w-full max-w-3xl aspect-[3/2] shadow-2xl z-20">
            {/* Responsive Padding: p-4 on mobile, md:p-12 on desktop */}
            <div className="flex-1 bg-[#fdfbf7] rounded-l-lg shadow-inner border-r border-stone-200 overflow-hidden relative p-4 md:p-12 text-stone-800">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-stone-900/5 pointer-events-none" />
              <div className="h-full overflow-y-auto custom-scrollbar relative z-10">
                <h4 className="text-xs font-bold text-stone-300 uppercase tracking-widest mb-4">
                   Page {currentPage + 1}
                </h4>
                <div className="prose prose-sm font-serif text-stone-700 leading-relaxed whitespace-pre-wrap">
                  {displayPages[currentPage]?.content || "End of diary."}
                </div>
              </div>
            </div>

            <div className="flex-1 bg-[#fdfbf7] rounded-r-lg shadow-inner border-l border-stone-200 overflow-hidden relative p-4 md:p-12 text-stone-800">
               <div className="absolute inset-0 bg-gradient-to-l from-transparent to-stone-900/5 pointer-events-none" />
               <div className="h-full overflow-y-auto custom-scrollbar relative z-10">
                 <h4 className="text-xs font-bold text-stone-300 uppercase tracking-widest mb-4 text-right">
                   Page {currentPage + 2}
                 </h4>
                 <div className="prose prose-sm font-serif text-stone-700 leading-relaxed whitespace-pre-wrap">
                   {displayPages[currentPage + 1]?.content || ""}
                 </div>
               </div>
            </div>
            
            <div className="absolute left-1/2 top-0 bottom-0 w-8 -ml-4 bg-gradient-to-r from-stone-300/20 via-stone-800/10 to-stone-300/20 pointer-events-none z-30 rounded-sm blur-sm"></div>
          </div>

          <button 
            onClick={() => turnPage('next')}
            disabled={!canGoNext}
            className={`relative z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer ${!canGoNext ? 'opacity-20 cursor-not-allowed' : 'opacity-100'}`}
          >
            <ChevronRight size={32} />
          </button>
        </div>
      </div>
    );
  };

  return <FlipBook />;
};

const DiaryPage = ({ isOwner }) => {
  const [books, setBooks] = useState([]);
  const [readingBook, setReadingBook] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const initData = async () => {
      // 1. Migrate old localStorage data if exists
      const legacyData = localStorage.getItem('diary_books');
      if (legacyData) {
        try {
           const parsed = JSON.parse(legacyData);
           for (const book of parsed) {
             await dbActions.put('diary_books', book);
           }
           localStorage.removeItem('diary_books');
        } catch(e) { console.error("Migration error", e); }
      }

      // 2. Load from IndexedDB
      try {
        const items = await dbActions.getAll('diary_books');
        if (items.length > 0) {
            setBooks(items.sort((a, b) => b.id - a.id));
        } else {
            // Default demo data
             const defaultBooks = [
                { 
                  id: 1, 
                  title: 'Our Story (Demo)', 
                  type: 'text', 
                  color: 'bg-rose-800', 
                  pages: [
                    {content: "Chapter 1\n\nWelcome to our digital diary. \n\nIf you log in, you can upload your own PDF diaries!"}, 
                    {content: "Chapter 2\n\nThis is just a demo book for guests to see what it looks like."},
                  ] 
                },
              ];
              setBooks(defaultBooks);
        }
      } catch (err) {
        console.error("Failed to load diary", err);
      }
    };
    
    initData();
  }, []);

  const deleteBook = async (e, id) => {
    e.stopPropagation();
    if(window.confirm("Delete this diary?")) {
      try {
        await dbActions.delete('diary_books', id);
        setBooks(prev => prev.filter(b => b.id !== id));
      } catch (err) {
        console.error("Failed to delete book", err);
      }
    }
  };

  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const newBook = {
          id: Date.now(),
          title: file.name.replace('.pdf', ''),
          type: 'pdf',
          content: event.target.result,
          color: ['bg-rose-800', 'bg-blue-800', 'bg-green-800', 'bg-amber-800', 'bg-slate-800'][Math.floor(Math.random()*5)],
        };
        
        try {
            await dbActions.put('diary_books', newBook);
            setBooks(prev => [newBook, ...prev]);
        } catch (err) {
            alert("Failed to save PDF. File might be too large for storage quota.");
        }
      };
      reader.readAsDataURL(file);
    } else {
        alert("Please select a valid PDF file.");
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-24 md:pt-32 px-4 bg-amber-50/50">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-serif text-amber-900">Bookshelf</h2>
          
          {isOwner && (
            <>
              <input 
                type="file" 
                accept="application/pdf" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handlePdfUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-amber-900 text-amber-50 px-4 py-2 rounded-lg hover:bg-amber-800 transition-colors shadow-sm text-sm font-medium tracking-wide flex items-center gap-2"
              >
                <Upload size={16} />
                Upload PDF Diary
              </button>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12 px-4">
          {books.map((book) => (
            <div key={book.id} className="relative group perspective-500 cursor-pointer" onClick={() => setReadingBook(book)}>
               <div className={`aspect-[3/4] ${book.color || 'bg-slate-700'} rounded-r-lg shadow-xl transform transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl flex flex-col items-center justify-center p-4 border-l-4 border-white/10 relative overflow-hidden`}>
                  
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none"></div>
                  
                  <div className="border border-white/30 p-4 w-full h-[80%] flex flex-col items-center justify-center text-center">
                    <h3 className="text-white font-serif text-lg leading-snug drop-shadow-md line-clamp-3">{book.title}</h3>
                    {book.type === 'pdf' && <span className="text-[10px] text-white/70 mt-2 uppercase border border-white/30 px-1 rounded">PDF</span>}
                  </div>

                  {isOwner && (
                    <button 
                      onClick={(e) => deleteBook(e, book.id)}
                      className="absolute top-2 right-2 bg-black/40 hover:bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all z-20 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
               </div>
               
               <div className="absolute -bottom-4 left-2 right-2 h-4 bg-black/20 blur-lg rounded-full transform group-hover:scale-90 transition-transform"></div>
            </div>
          ))}
        </div>
      </div>

      {readingBook && (
        <BookReader 
          book={readingBook} 
          onClose={() => setReadingBook(null)} 
        />
      )}
    </div>
  );
};


// --- MAIN APP ---
const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check for existing session on load
    const savedSession = localStorage.getItem('current_session');
    if (savedSession) {
        try {
            setUser(JSON.parse(savedSession));
        } catch (e) {
            console.error("Failed to parse session", e);
        }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('current_session', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('current_session');
  };

  const renderContent = () => {
    const isOwner = !!user; 
    switch (activeTab) {
      case 'home': return <HomePage onNavigate={setActiveTab} onLogin={handleLogin} onLogout={handleLogout} user={user} />;
      case 'wall': return <LoveWall isOwner={isOwner} />;
      case 'letters': return <LettersPage isOwner={isOwner} />;
      case 'diary': return <DiaryPage isOwner={isOwner} />;
      default: return <HomePage onNavigate={setActiveTab} onLogin={handleLogin} onLogout={handleLogout} user={user} />;
    }
  };

  return (
    <div className="font-sans text-gray-800 antialiased selection:bg-rose-200 selection:text-rose-900">
      {renderContent()}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <style>{`
        @import url('[https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Dancing+Script:wght@400;700&family=Lato:wght@300;400;700&display=swap](https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Dancing+Script:wght@400;700&family=Lato:wght@300;400;700&display=swap)');
        
        .font-serif { font-family: 'Playfair Display', serif; }
        .font-handwriting { font-family: 'Dancing Script', cursive; }
        .font-sans { font-family: 'Lato', sans-serif; }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d6d3d1;
          border-radius: 4px;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
};

export default App;
