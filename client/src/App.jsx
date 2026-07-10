import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import TagSidebar from './components/TagSidebar';
import MediaFeed from './components/MediaFeed';
import MediaCard from './components/MediaCard';
import BooruBar from './components/BooruBar';
import UploadModal from './components/UploadModal';
import CinemaModal from './components/CinemaModal';
import { AuthModal } from './components/AuthModal';
import AdminPanel from './components/AdminPanel';
import DevPanel from './components/DevPanel';
import UserProfilePage from './components/UserProfilePage';
import { ChevronLeft, ChevronRight, ChevronsLeft, PlusCircle, Terminal } from 'lucide-react';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(true);

  // Authentication & Current User state
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('prismshare_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // App Navigation Mode: 'local' | 'booru' | 'admin' | 'dev'
  const [mode, setMode] = useState('local');

  // Admin & Dev state
  const [users, setUsers] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [devStats, setDevStats] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [devLoading, setDevLoading] = useState(false);

  // Booru Engine state
  const [booruSites, setBooruSites] = useState([]);
  const [selectedBooruSite, setSelectedBooruSite] = useState('sb');
  const [booruTags, setBooruTags] = useState('');
  const [booruType, setBooruType] = useState('video');
  const [booruPosts, setBooruPosts] = useState([]);
  const [booruPage, setBooruPage] = useState(1);
  const [booruLoading, setBooruLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [importingIds, setImportingIds] = useState([]);

  // Local Filters state
  const [selectedType, setSelectedType] = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');

  // Modals state
  const [selectedPostForModal, setSelectedPostForModal] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);

  // Sincronização automática de Páginas/Rotas com a URL do navegador
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/profile/')) {
      const username = decodeURIComponent(path.replace('/profile/', '').trim());
      if (username) {
        setSelectedProfileUser(username);
        setMode('profile');
      }
    } else if (path === '/booru') {
      setMode('booru');
      setSelectedProfileUser(null);
    } else if (path === '/admin') {
      setMode('admin');
      setSelectedProfileUser(null);
    } else if (path === '/dev') {
      setMode('dev');
      setSelectedProfileUser(null);
    } else {
      setMode('local');
      setSelectedProfileUser(null);
    }
  }, [location.pathname]);

  const handleOpenProfile = (username) => {
    if (!username) return;
    const cleanUser = username.replace(/^@/, '').trim();
    setSelectedProfileUser(cleanUser);
    setMode('profile');
    navigate(`/profile/${encodeURIComponent(cleanUser)}`);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode !== 'profile') {
      setSelectedProfileUser(null);
    }
    if (newMode === 'booru') navigate('/booru');
    else if (newMode === 'admin') navigate('/admin');
    else if (newMode === 'dev') navigate('/dev');
    else if (newMode === 'local') navigate('/');
  };

  const handleAuthSuccess = (userData) => {
    setCurrentUser(userData);
    try {
      localStorage.setItem('prismshare_current_user', JSON.stringify(userData));
      if (userData && userData.token) {
        localStorage.setItem('prismshare_auth_token', userData.token);
      }
    } catch (err) {
      console.error('Erro ao salvar usuário no localStorage:', err);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setMode('local');
    try {
      localStorage.removeItem('prismshare_current_user');
      localStorage.removeItem('prismshare_auth_token');
    } catch (err) {
      console.error('Erro ao remover usuário do localStorage:', err);
    }
  };

  const handleRequireAuth = (actionCallback) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return false;
    }
    if (actionCallback) actionCallback();
    return true;
  };

  // Monta os headers de autenticação usando o token JWT emitido no login/registro,
  // em vez de simplesmente informar o username (que qualquer um poderia forjar).
  const authHeaders = () => ({
    'Content-Type': 'application/json',
    ...(currentUser && currentUser.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {})
  });

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch('/api/tags');
      if (res.ok) {
        const data = await res.json();
        setAllTags(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro ao buscar tags:', err);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType !== 'all') params.append('type', selectedType);
      if (selectedTags.length > 0) params.append('tag', selectedTags.join(','));
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (sortBy) params.append('sort', sortBy);

      const res = await fetch(`/api/media?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro ao buscar posts:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedTags, searchQuery, sortBy]);

  const fetchBooruSites = useCallback(async () => {
    try {
      const res = await fetch('/api/booru/sites');
      if (res.ok) {
        const data = await res.json();
        setBooruSites(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro ao buscar sites booru:', err);
    }
  }, []);

  const fetchBooruPosts = useCallback(async (customTags = booruTags, customSite = selectedBooruSite, customType = booruType, page = 1, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setBooruLoading(true);
    }
    try {
      const params = new URLSearchParams({
        site: customSite || 'sb',
        tags: customTags || '',
        type: customType || 'all',
        limit: 36,
        page: String(page || 1)
      });
      const res = await fetch(`/api/booru/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          if (append) {
            setBooruPosts(prev => {
              const existingIds = new Set((Array.isArray(prev) ? prev : []).map(p => p.id));
              const newItems = data.filter(item => !existingIds.has(item.id));
              return [...(Array.isArray(prev) ? prev : []), ...newItems];
            });
          } else {
            setBooruPosts(data);
          }
        } else if (!append) {
          setBooruPosts([]);
        }
      } else if (!append) {
        setBooruPosts([]);
      }
    } catch (err) {
      console.error('Erro em busca Booru:', err);
      if (!append) setBooruPosts([]);
    } finally {
      setBooruLoading(false);
      setLoadingMore(false);
    }
  }, [booruTags, selectedBooruSite, booruType]);

  useEffect(() => {
    fetchTags();
    fetchBooruSites();
  }, [fetchTags, fetchBooruSites]);

  useEffect(() => {
    if (mode === 'local') {
      fetchPosts();
    }
  }, [mode, fetchPosts]);

  const fetchAdminData = useCallback(async () => {
    if (!currentUser) return;
    setAdminLoading(true);
    try {
      const headers = authHeaders();
      const [resUsers, resAudit] = await Promise.all([
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/audit', { headers })
      ]);
      if (resUsers.ok) {
        const data = await resUsers.json();
        setUsers(data);
      }
      if (resAudit.ok) {
        const data = await resAudit.json();
        setAuditLog(data);
      }
    } catch (err) {
      console.error('Erro ao buscar dados do painel admin:', err);
    } finally {
      setAdminLoading(false);
    }
  }, [currentUser]);

  const fetchDevData = useCallback(async () => {
    if (!currentUser) return;
    setDevLoading(true);
    try {
      const res = await fetch('/api/dev/stats', {
        headers: authHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setDevStats(data);
      }
    } catch (err) {
      console.error('Erro ao buscar dados do painel dev:', err);
    } finally {
      setDevLoading(false);
    }
  }, [currentUser]);

  const handleBanPost = async (postId, reason) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/admin/ban/${postId}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        const updatedPost = await res.json();
        setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
        if (selectedPostForModal && selectedPostForModal.id === postId) {
          setSelectedPostForModal(updatedPost);
        }
        fetchAdminData();
      }
    } catch (err) {
      console.error('Erro ao banir post:', err);
    }
  };

  const handleUnbanPost = async (postId) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/admin/unban/${postId}`, {
        method: 'POST',
        headers: authHeaders()
      });
      if (res.ok) {
        const updatedPost = await res.json();
        setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
        if (selectedPostForModal && selectedPostForModal.id === postId) {
          setSelectedPostForModal(updatedPost);
        }
        fetchAdminData();
      }
    } catch (err) {
      console.error('Erro ao desbanir post:', err);
    }
  };

  const handleSetUserRole = async (userId, newRole) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error('Erro ao alterar role do usuário:', err);
    }
  };

  useEffect(() => {
    if (mode === 'admin') {
      fetchAdminData();
    } else if (mode === 'dev') {
      fetchDevData();
      fetchAdminData(); // DevPanel needs some user lists / logs too
    }
  }, [mode, fetchAdminData, fetchDevData]);

  useEffect(() => {
    if (mode === 'booru' && booruPosts.length === 0) {
      setBooruPage(1);
      fetchBooruPosts(booruTags, selectedBooruSite, booruType, 1, false);
    }
  }, [mode]);

  const handleBooruSiteChange = (newSite) => {
    setSelectedBooruSite(newSite);
    setBooruPage(1);
    fetchBooruPosts(booruTags, newSite, booruType, 1, false);
  };

  const handleBooruTypeChange = (newType) => {
    setBooruType(newType);
    setBooruPage(1);
    fetchBooruPosts(booruTags, selectedBooruSite, newType, 1, false);
  };

  const handleBooruSearchSubmit = (tagsQuery) => {
    setBooruPage(1);
    fetchBooruPosts(tagsQuery, selectedBooruSite, booruType, 1, false);
  };

  // Navegação numérica de páginas (ir para página X, substituindo o feed ou navegando para trás/frente)
  const handlePageSelect = (targetPage) => {
    if (targetPage < 1 || targetPage === booruPage || booruLoading) return;
    setBooruPage(targetPage);
    fetchBooruPosts(booruTags, selectedBooruSite, booruType, targetPage, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Carregar mais adicionando na mesma grade
  const handleLoadMoreBooru = () => {
    const nextPage = booruPage + 1;
    setBooruPage(nextPage);
    fetchBooruPosts(booruTags, selectedBooruSite, booruType, nextPage, true);
  };

  const handleToggleTag = (tagName) => {
    if (!tagName) return;
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter(t => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const handleClearTags = () => {
    setSelectedTags([]);
  };

  const handleTagClickFromCard = (tagName, resetAll = false) => {
    if (mode === 'booru') {
      setBooruTags(tagName || '');
      setBooruPage(1);
      fetchBooruPosts(tagName || '', selectedBooruSite, booruType, 1, false);
      return;
    }
    if (resetAll) {
      setSelectedTags([]);
      setSearchQuery('');
      setSelectedType('all');
      return;
    }
    if (!selectedTags.includes(tagName)) {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const handleCardClick = async (post) => {
    if (!post) return;
    if (post.external) {
      setSelectedPostForModal(post);
      return;
    }
    try {
      const res = await fetch(`/api/media/${post.id}`);
      if (res.ok) {
        const updatedPost = await res.json();
        setSelectedPostForModal(updatedPost);
        fetchPosts();
      } else {
        setSelectedPostForModal(post);
      }
    } catch {
      setSelectedPostForModal(post);
    }
  };

  const handleLike = async (id) => {
    handleRequireAuth(async () => {
      try {
        const res = await fetch(`/api/media/${id}/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: currentUser ? currentUser.username : null })
        });
        if (res.ok) {
          const updated = await res.json();
          setPosts(prev => (Array.isArray(prev) ? prev : []).map(p => p.id === id ? updated : p));
          if (selectedPostForModal && selectedPostForModal.id === id) {
            setSelectedPostForModal(updated);
          }
        }
      } catch (err) {
        console.error('Erro ao curtir post:', err);
      }
    });
  };

  const handleCommentAdd = (id, newComment) => {
    setPosts(prev => (Array.isArray(prev) ? prev : []).map(p => {
      if (p.id === id) {
        const comments = Array.isArray(p.comments) ? p.comments : [];
        return { ...p, comments: [...comments, newComment] };
      }
      return p;
    }));
    if (selectedPostForModal && selectedPostForModal.id === id) {
      const comments = Array.isArray(selectedPostForModal.comments) ? selectedPostForModal.comments : [];
      setSelectedPostForModal({
        ...selectedPostForModal,
        comments: [...comments, newComment]
      });
    }
  };

  const handleImportPost = async (externalPost) => {
    if (!externalPost || importingIds.includes(externalPost.id)) return;
    setImportingIds(prev => [...prev, externalPost.id]);

    try {
      const res = await fetch('/api/booru/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: externalPost.title,
          description: externalPost.description,
          filename: externalPost.filename,
          url: externalPost.url,
          type: externalPost.type,
          tags: externalPost.tags
        })
      });

      if (res.ok) {
        const newLocalPost = await res.json();
        fetchTags();
        fetchPosts();
        alert(`Mídia "${externalPost.title}" importada permanentemente para o seu Feed Local com sucesso!`);
        if (selectedPostForModal && selectedPostForModal.id === externalPost.id) {
          setSelectedPostForModal(newLocalPost);
        }
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Falha ao importar');
      }
    } catch (err) {
      console.error('Erro na importação:', err);
      alert(`Erro: Não foi possível importar o post: ${err.message}`);
    } finally {
      setImportingIds(prev => prev.filter(id => id !== externalPost.id));
    }
  };

  const handleUploadSuccess = (newPost) => {
    setIsUploadOpen(false);
    fetchTags();
    fetchPosts();
    setMode('local');
    setSelectedPostForModal(newPost);
  };

  const safeBooruPosts = Array.isArray(booruPosts) ? booruPosts : [];

  // Gera array com páginas ao redor da atual (ex: 1, 2, 3, 4, 5)
  const getPageNumbers = () => {
    const start = Math.max(1, booruPage - 2);
    const pages = [];
    for (let i = start; i <= start + 4; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#000000' }}>
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenUpload={() => setIsUploadOpen(true)}
        allTags={allTags}
        onSelectTag={(tagName) => handleTagClickFromCard(tagName)}
        selectedTags={selectedTags}
        mode={mode}
        onModeChange={handleModeChange}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenProfile={handleOpenProfile}
      />

      {mode === 'booru' && (
        <BooruBar
          sites={booruSites}
          selectedSite={selectedBooruSite}
          onSelectSite={handleBooruSiteChange}
          booruTags={booruTags}
          onBooruTagsChange={setBooruTags}
          booruType={booruType}
          onBooruTypeChange={handleBooruTypeChange}
          onSearchSubmit={handleBooruSearchSubmit}
          loading={booruLoading}
        />
      )}

      <div className="main-layout">
        {mode === 'local' && (
          <TagSidebar
            tags={allTags}
            selectedTags={selectedTags}
            onToggleTag={handleToggleTag}
            onClearTags={handleClearTags}
          />
        )}

        {mode === 'local' ? (
          <MediaFeed
            posts={posts}
            loading={loading}
            selectedType={selectedType}
            onSelectType={setSelectedType}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onCardClick={handleCardClick}
            onLike={handleLike}
            onTagClick={handleTagClickFromCard}
            onImportPost={handleImportPost}
            importingIds={importingIds}
            selectedTags={selectedTags}
            searchQuery={searchQuery}
            currentUser={currentUser}
            onOpenProfile={handleOpenProfile}
          />
        ) : mode === 'booru' ? (
          <main className="feed-section" style={{ width: '100%' }}>
            {/* Top Info Bar with Quick Page indicator */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid #222', paddingBottom: '0.75rem' }}>
              <span className="font-mono" style={{ fontSize: '0.85rem', color: '#888' }}>
                RESULTADOS BOORU ({selectedBooruSite.toUpperCase()}): <strong style={{ color: '#a78bfa' }}>{safeBooruPosts.length}</strong> ITENS EXIBIDOS | PÁGINA ATUAL: <strong style={{ color: '#fff', backgroundColor: '#1a1a1a', padding: '0.2rem 0.6rem', border: '1px solid #a78bfa' }}>#{booruPage}</strong>
              </span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#666', fontFamily: 'JetBrains Mono, monospace', marginRight: '0.5rem' }}>
                  NAVEGAÇÃO RÁPIDA:
                </span>
                <button
                  type="button"
                  onClick={() => handlePageSelect(1)}
                  disabled={booruPage === 1 || booruLoading}
                  style={{
                    backgroundColor: '#0c0c0c',
                    color: booruPage === 1 ? '#444' : '#a78bfa',
                    border: '1px solid #333',
                    padding: '0.35rem 0.65rem',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.75rem',
                    cursor: booruPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                  title="Ir para Primeira Página (Mais Recentes)"
                >
                  &lt;&lt; PÁG 1
                </button>
                <button
                  type="button"
                  onClick={() => handlePageSelect(booruPage - 1)}
                  disabled={booruPage === 1 || booruLoading}
                  style={{
                    backgroundColor: '#0c0c0c',
                    color: booruPage === 1 ? '#444' : '#fff',
                    border: '1px solid #333',
                    padding: '0.35rem 0.65rem',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.75rem',
                    cursor: booruPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  &lt; ANTERIOR
                </button>
                <button
                  type="button"
                  onClick={() => handlePageSelect(booruPage + 1)}
                  disabled={booruLoading}
                  style={{
                    backgroundColor: '#a78bfa',
                    color: '#000',
                    border: '1px solid #a78bfa',
                    padding: '0.35rem 0.65rem',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    cursor: booruLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  PRÓXIMA &gt;
                </button>
              </div>
            </div>

            {booruLoading ? (
              <div style={{ textAlign: 'center', padding: '6rem 0', fontFamily: 'JetBrains Mono, monospace', color: '#a78bfa' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>CONECTANDO À API E CARREGANDO PÁGINA #{booruPage}...</div>
                <div style={{ color: '#666', fontSize: '0.85rem' }}>Buscando vídeos e imagens via @himeka/booru + HTML Scraper e preparando proxy de streaming.</div>
              </div>
            ) : safeBooruPosts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '6rem 1rem', border: '1px dashed #333', backgroundColor: '#050505' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontFamily: 'JetBrains Mono, monospace', color: '#fff' }}>
                  NENHUMA MÍDIA ENCONTRADA NESSE BOORU OU PÁGINA #{booruPage}
                </h3>
                <p style={{ color: '#888', maxWidth: '400px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
                  Tente voltar para páginas anteriores ou buscar outras tags (ex: <code style={{ color: '#a78bfa' }}>cyberpunk</code>, <code style={{ color: '#a78bfa' }}>animated</code>)!
                </p>
                {booruPage > 1 && (
                  <button
                    type="button"
                    onClick={() => handlePageSelect(1)}
                    style={{
                      backgroundColor: '#a78bfa',
                      color: '#000',
                      border: 'none',
                      padding: '0.6rem 1.25rem',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    &lt;&lt; VOLTAR PARA A PÁGINA 1
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="masonry-grid">
                  {safeBooruPosts.map((post, idx) => (
                    <MediaCard
                      key={`${post.id || 'post'}-${idx}`}
                      post={post}
                      onCardClick={handleCardClick}
                      onLike={handleLike}
                      onTagClick={handleTagClickFromCard}
                      onImportPost={handleImportPost}
                      importingIds={importingIds}
                      currentUser={currentUser}
                      onOpenProfile={handleOpenProfile}
                    />
                  ))}
                </div>

                {/* BOTÕES NUMÉRICOS DE PAGINAÇÃO COMPLETA */}
                <div style={{ marginTop: '3.5rem', marginBottom: '3rem', borderTop: '1px solid #222', paddingTop: '2rem' }}>
                  <div style={{ textAlign: 'center', marginBottom: '1rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: '#888' }}>
                    NAVEGAR ENTRE AS PÁGINAS DO BOORU (MAIS NOVOS &lt;=&gt; MAIS ANTIGOS):
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {/* Primeira página (Mais novos) */}
                    <button
                      type="button"
                      onClick={() => handlePageSelect(1)}
                      disabled={booruPage === 1 || booruLoading}
                      style={{
                        backgroundColor: '#0a0a0a',
                        color: booruPage === 1 ? '#444' : '#fff',
                        border: '1px solid #333',
                        padding: '0.65rem 1rem',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.85rem',
                        cursor: booruPage === 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                      title="Ir para o início (Página 1)"
                    >
                      <ChevronsLeft size={16} /> PÁG 1 (INÍCIO)
                    </button>

                    {/* Página Anterior */}
                    <button
                      type="button"
                      onClick={() => handlePageSelect(booruPage - 1)}
                      disabled={booruPage === 1 || booruLoading}
                      style={{
                        backgroundColor: '#0a0a0a',
                        color: booruPage === 1 ? '#444' : '#a78bfa',
                        border: '1px solid #333',
                        padding: '0.65rem 1rem',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.85rem',
                        cursor: booruPage === 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <ChevronLeft size={16} /> ANTERIOR
                    </button>

                    {/* Botões numéricos centrados na página atual */}
                    {getPageNumbers().map((pNum) => {
                      const isCurrent = pNum === booruPage;
                      return (
                        <button
                          key={pNum}
                          type="button"
                          onClick={() => handlePageSelect(pNum)}
                          disabled={booruLoading || isCurrent}
                          style={{
                            backgroundColor: isCurrent ? '#a78bfa' : '#0e0e0e',
                            color: isCurrent ? '#000000' : '#ffffff',
                            border: `1px solid ${isCurrent ? '#a78bfa' : '#333'}`,
                            padding: '0.65rem 1.1rem',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '0.9rem',
                            fontWeight: isCurrent ? 800 : 500,
                            cursor: isCurrent ? 'default' : 'pointer',
                            boxShadow: isCurrent ? '0 0 12px rgba(167, 139, 250, 0.4)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {pNum}
                        </button>
                      );
                    })}

                    {/* Próxima Página (Mais antigos) */}
                    <button
                      type="button"
                      onClick={() => handlePageSelect(booruPage + 1)}
                      disabled={booruLoading}
                      style={{
                        backgroundColor: '#0a0a0a',
                        color: '#a78bfa',
                        border: '1px solid #a78bfa',
                        padding: '0.65rem 1.1rem',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        cursor: booruLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      PRÓXIMA <ChevronRight size={16} />
                    </button>

                    {/* Botão de somar / acumular mais na mesma página caso queira */}
                    <button
                      type="button"
                      onClick={handleLoadMoreBooru}
                      disabled={loadingMore || booruLoading}
                      style={{
                        backgroundColor: '#111',
                        color: '#aaa',
                        border: '1px dashed #444',
                        padding: '0.65rem 1rem',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.8rem',
                        cursor: loadingMore ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        marginLeft: '0.5rem'
                      }}
                      title="Soma os vídeos da próxima página logo abaixo da grade atual"
                    >
                      <PlusCircle size={15} />
                      {loadingMore ? 'SOMANDO...' : '+ SOMAR NA MESMA TELA'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </main>
        ) : mode === 'admin' ? (
          <div style={{ width: '100%' }}>
            {adminLoading ? (
              <div style={{ textAlign: 'center', padding: '6rem 0', fontFamily: 'JetBrains Mono, monospace', color: '#a78bfa' }}>
                Carregando dados de moderação...
              </div>
            ) : (
              <AdminPanel
                currentUser={currentUser}
                posts={posts}
                onBanPost={handleBanPost}
                onUnbanPost={handleUnbanPost}
                onBack={() => setMode('local')}
                users={users}
                onSetUserRole={handleSetUserRole}
                auditLog={auditLog}
              />
            )}
          </div>
        ) : mode === 'dev' ? (
          <div style={{ width: '100%' }}>
            {devLoading ? (
              <div style={{ textAlign: 'center', padding: '6rem 0', fontFamily: 'JetBrains Mono, monospace', color: '#a78bfa' }}>
                Carregando estatísticas do sistema...
              </div>
            ) : (
              <DevPanel
                currentUser={currentUser}
                stats={devStats || {}}
                onBack={() => setMode('local')}
              />
            )}
          </div>
        ) : mode === 'profile' && selectedProfileUser ? (
          <div style={{ width: '100%' }}>
            <UserProfilePage
              username={selectedProfileUser}
              currentUser={currentUser}
              onBack={() => {
                handleModeChange('local');
              }}
              onSelectPost={(post) => setSelectedPostForModal(post)}
              onOpenUpload={() => setIsUploadOpen(true)}
              onRequireAuth={handleRequireAuth}
              onLike={handleLike}
              onOpenProfile={handleOpenProfile}
            />
          </div>
        ) : null}
      </div>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      {selectedPostForModal && (
        <CinemaModal
          post={selectedPostForModal}
          onClose={() => setSelectedPostForModal(null)}
          onLike={handleLike}
          onTagClick={(tag) => handleTagClickFromCard(tag)}
          onCommentAdd={handleCommentAdd}
          onImportPost={handleImportPost}
          importingIds={importingIds}
          currentUser={currentUser}
          onRequireAuth={handleRequireAuth}
          onOpenProfile={handleOpenProfile}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}