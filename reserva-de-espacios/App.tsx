import React, { useState, useEffect } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Reservation, UserRole, Space, User, AppConfig } from './types';
import GlassCard from './components/GlassCard';

// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://lntwrneueovxpjobbdiu.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxudHdybmV1ZW92eHBqb2JiZGl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MjUzNjYsImV4cCI6MjA4NTQwMTM2Nn0.N7dSntT2Dnmm_7sB6_1YK-gf-NNBglRIQOb9hlL9XtY';

// Configuración de Administrador
const ADMIN_EMAIL = 'teologado2022@gmail.com';

// Inicializar cliente
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Constants & Data ---
const DURATIONS = ['1 Hora', '2 Horas', '3 Horas', '4 Horas', 'Medio Día', 'Todo el Día'];
const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Temas Predefinidos
const APP_THEMES = [
  { name: 'Terracota (Original)', color: '#ea580c' },
  { name: 'Océano Profundo', color: '#0284c7' },
  { name: 'Bosque Esmeralda', color: '#16a34a' },
  { name: 'Amatista Real', color: '#7c3aed' },
  { name: 'Frambuesa Intenso', color: '#db2777' },
  { name: 'Carbón Ejecutivo', color: '#475569' },
];

const generateId = () => Math.random().toString(36).substr(2, 9) + '-' + Date.now();

// Helper para convertir Hex a RGBA (para fondos claros)
const hexToRgba = (hex: string, alpha: number) => {
  let c: any;
  if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
      c= hex.substring(1).split('');
      if(c.length== 3){
          c= [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c= '0x'+c.join('');
      return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
  }
  return hex;
};

// --- Helper Components ---
const StatusBadge = ({ status }: { status: string }) => {
  const colors = { 
    pending: 'bg-orange-100 text-orange-700 border-orange-200', 
    confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200', 
    rejected: 'bg-red-100 text-red-700 border-red-200' 
  };
  const labels = { pending: 'Pendiente', confirmed: 'Aprobado', rejected: 'Rechazado' };
  const key = status as keyof typeof colors;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase border ${colors[key] || 'bg-gray-100'}`}>
      {labels[key] || status}
    </span>
  );
};

// --- Auth Component ---
const AuthScreen: React.FC<{ supabase: SupabaseClient, config: AppConfig }> = ({ supabase, config }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; 

    setLoading(true);
    setError('');
    setMsg('');

    try {
      if (isRecovery) {
         const { error } = await supabase.auth.resetPasswordForEmail(email, {
           redirectTo: window.location.href,
         });
         if (error) throw error;
         setMsg('Te hemos enviado un enlace de recuperación a tu correo.');
         setIsRecovery(false);
      } else if (isRegistering) {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { full_name: email.split('@')[0] },
            emailRedirectTo: window.location.origin
          }
        });
        
        if (error) throw error;
        
        if (data.session) {
           setMsg('¡Registro exitoso! Iniciando sesión...');
        } else if (data.user && !data.session) {
          setMsg('Cuenta creada. Nota: Si no entras automáticamente, verifica si tienes activada la confirmación de correo en Supabase.');
        }
        
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      let message = err.message || 'Error de autenticación';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: `linear-gradient(135deg, ${hexToRgba(config.primary_color, 0.8)} 0%, ${hexToRgba(config.primary_color, 0.4)} 100%)`
    }}>
      <GlassCard className="w-full max-w-md animate-[fadeIn_0.5s_ease]">
        <div className="text-center mb-8">
          <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm shadow-xl overflow-hidden border-2 border-white/30">
            {config.icon_url ? (
               <img src={config.icon_url} alt="Logo" className="w-full h-full object-cover p-1" />
            ) : (
               <i className="fas fa-church text-4xl text-white"></i>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 drop-shadow-lg tracking-tight">
            {config.app_name}
          </h1>
          <p className="text-white/90 font-medium text-xl drop-shadow-md">
            {isRecovery ? 'Recuperar Contraseña' : (isRegistering ? 'Crear Cuenta' : 'Bienvenido')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/80 text-xs font-bold uppercase mb-1">Correo Electrónico</label>
            <input 
              required 
              type="email" 
              name="email"
              className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/10 text-white placeholder-white/50 focus:bg-white/30 focus:border-white/50 outline-none transition-all shadow-sm"
              placeholder="usuario@ejemplo.com"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              disabled={loading}
            />
          </div>

          {!isRecovery && (
            <div>
              <label className="block text-white/80 text-xs font-bold uppercase mb-1">Contraseña</label>
              <input 
                required 
                type="password" 
                name="password"
                className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/10 text-white placeholder-white/50 focus:bg-white/30 focus:border-white/50 outline-none transition-all shadow-sm"
                placeholder="••••••••"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                disabled={loading}
              />
              {!isRegistering && (
                <div className="text-right mt-1">
                  <button 
                    type="button"
                    onClick={() => { setIsRecovery(true); setError(''); setMsg(''); }}
                    className="text-xs text-white/70 hover:text-white underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-red-100 bg-red-500/40 p-3 rounded-lg text-sm text-center border border-red-500/50 shadow-sm flex items-center justify-center gap-2 animate-pulse"><i className="fas fa-exclamation-triangle"></i> {error}</p>}
          {msg && <p className="text-emerald-100 bg-emerald-500/40 p-3 rounded-lg text-sm text-center border border-emerald-500/50 shadow-sm flex items-center justify-center gap-2"><i className="fas fa-check-circle"></i> {msg}</p>}

          <button 
            disabled={loading} 
            type="submit" 
            style={{ backgroundColor: config.primary_color }}
            className={`w-full font-bold py-3 rounded-lg shadow-lg transform transition-all mt-4 text-white hover:opacity-90 active:scale-[0.98] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 
              <span><i className="fas fa-spinner fa-spin mr-2"></i> Procesando...</span> : 
              (isRecovery ? 'Enviar enlace' : (isRegistering ? 'Registrarse e Ingresar' : 'Iniciar Sesión'))
            }
          </button>
        </form>

        <div className="mt-6 text-center">
          {isRecovery ? (
             <button 
               disabled={loading}
               onClick={() => { setIsRecovery(false); setError(''); setMsg(''); }} 
               className="text-white/80 hover:text-white text-sm underline decoration-white/30 hover:decoration-white disabled:opacity-50"
             >
               Volver a Iniciar Sesión
             </button>
          ) : (
            <button 
              disabled={loading}
              onClick={() => { setIsRegistering(!isRegistering); setError(''); setMsg(''); }} 
              className="text-white/80 hover:text-white text-sm underline decoration-white/30 hover:decoration-white disabled:opacity-50"
            >
              {isRegistering ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

const App: React.FC = () => {
  // --- Global State ---
  const [user, setUser] = useState<User | null>(null);
  const [config, setConfig] = useState<AppConfig>({
    id: 1,
    app_name: 'Reserva de Espacios',
    primary_color: '#ea580c',
    icon_url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjkwIiBmaWxsPSIjZmZmNWViIiAvPjxwYXRoIGQ9Ik00MCAxNDAgTDQwIDE1MCBRMTAwIDE4MCAxNjAgMTUwIEwxNjAgMTQwIFoiIGZpbGw9IiNjMjQxMGMiIC8+PHBhdGggZD0iTTUwIDE0MCBMNTAgODAgTDEwMCA0MCBMMTUwIDgwIEwxNTAgMTQwIFoiIGZpbGw9IiNlYTU4MGMiIC8+PHJlY3QgeD0iOTAiIHk9IjEwMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjZmZmIiByeD0iNSIgLz48L3N2Zz4='
  });
  const [spaces, setSpaces] = useState<Space[]>([]); 
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [moderators, setModerators] = useState<{email: string}[]>([]); 
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  
  // --- UI State ---
  const [role, setRole] = useState<UserRole>('user'); 
  const [activeTab, setActiveTab] = useState<'dashboard' | 'my-bookings' | 'calendar'>('dashboard');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [bookingError, setBookingError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // --- Admin UI State ---
  const [adminTab, setAdminTab] = useState<'reservations' | 'spaces' | 'calendar' | 'settings'>('reservations');
  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [adminDateFilter, setAdminDateFilter] = useState('');
  // Changed default to 'pending' to clear handled requests from the feed automatically
  const [adminStatusFilter, setAdminStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('pending');
  
  const [adminSpaceNameFilter, setAdminSpaceNameFilter] = useState('');
  const [adminSpaceCapacityFilter, setAdminSpaceCapacityFilter] = useState('');

  const [configForm, setConfigForm] = useState<AppConfig>({ ...config });
  const [newModeratorEmail, setNewModeratorEmail] = useState(''); 

  const [currentDate, setCurrentDate] = useState(new Date());

  // --- Forms State ---
  const [bookingForm, setBookingForm] = useState({
    date: '',
    time: '',
    duration: DURATIONS[0],
    reason: '',
    full_name: ''
  });

  const [spaceForm, setSpaceForm] = useState({
    name: '',
    description: '',
    capacity: 0,
    features: '', 
    image: ''
  });

  // --- Data Functions ---
  const fetchConfig = async () => {
    try {
      const { data } = await supabaseClient.from('app_config').select('*').single();
      if (data) setConfig(data as AppConfig);
    } catch(e) { console.error(e); }
  };

  const fetchSpaces = async () => {
    const { data } = await supabaseClient.from('spaces').select('*').order('name');
    if (data) setSpaces(data as Space[]);
  };

  const fetchReservations = async () => {
    setIsDataLoading(true);
    const { data } = await supabaseClient.from('reservations').select('*').order('created_at', { ascending: false });
    if (data) setReservations(data as Reservation[]);
    setIsDataLoading(false);
  };

  const fetchModerators = async () => {
    const { data } = await supabaseClient.from('user_roles').select('email').eq('role', 'moderator');
    if (data) setModerators(data as {email: string}[]);
  };

  useEffect(() => {
    const handleUserSession = async (session: any) => {
      if (session?.user) {
        // Safe access to user email with fallback
        const userEmail = session.user.email || 'unknown@user.com';
        let derivedRole: UserRole = 'user';
        
        if (userEmail === ADMIN_EMAIL) {
          derivedRole = 'admin';
        } else {
          const { data } = await supabaseClient.from('user_roles').select('role').eq('email', userEmail).single();
          if (data && data.role === 'moderator') derivedRole = 'moderator';
        }
        
        setUser({ id: session.user.id, email: userEmail, role: derivedRole });
        setRole(derivedRole);
        if (derivedRole === 'admin') fetchModerators();
      } else {
        setUser(null);
      }
    };

    const init = async () => {
      try {
        await fetchConfig();
        const { data: { session } } = await supabaseClient.auth.getSession();
        await handleUserSession(session);
        await fetchSpaces();
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setIsAppReady(true);
      }
    };

    init();

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      handleUserSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const channel = supabaseClient
      .channel('public-config-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_config' }, () => {
        fetchConfig();
      })
      .subscribe();
    return () => { supabaseClient.removeChannel(channel); }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchReservations();
    fetchSpaces();
    if(user.role === 'admin') fetchModerators();
    const channel = supabaseClient
      .channel('user-data-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => fetchReservations())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spaces' }, () => fetchSpaces())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, async () => {
         const { data: { session } } = await supabaseClient.auth.getSession();
         const currentUserEmail = user.email || '';
         if (session?.user?.email === currentUserEmail && currentUserEmail !== ADMIN_EMAIL) {
            const { data } = await supabaseClient.from('user_roles').select('role').eq('email', currentUserEmail).single();
            const newRole = (data && data.role === 'moderator') ? 'moderator' : 'user';
            setRole(newRole);
            setUser(prev => prev ? {...prev, role: newRole} : null);
         }
         if (user.role === 'admin') fetchModerators();
      })
      .subscribe();
    return () => { supabaseClient.removeChannel(channel); }
  }, [user?.email]);

  useEffect(() => {
    document.title = config.app_name;
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    if (config.icon_url) link.href = config.icon_url;
    
    const styleId = 'dynamic-theme-styles';
    let styleTag = document.getElementById(styleId);
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = `
      body {
        background: linear-gradient(135deg, ${hexToRgba(config.primary_color, 0.6)} 0%, ${hexToRgba(config.primary_color, 0.9)} 100%);
        background-attachment: fixed;
      }
      .text-primary { color: ${config.primary_color} !important; }
      .bg-primary { background-color: ${config.primary_color} !important; }
      .bg-primary-light { background-color: ${hexToRgba(config.primary_color, 0.1)} !important; }
      .border-primary { border-color: ${config.primary_color} !important; }
    `;
    setConfigForm(config);
  }, [config]);

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    setUser(null);
    setActiveTab('dashboard');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, folder: 'config' | 'spaces', setter: (value: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("La imagen es demasiado grande (máx 2MB)."); return; }
    setIsUploading(true);
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const { error: uploadError } = await supabaseClient.storage.from('media').upload(fileName, file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data } = supabaseClient.storage.from('media').getPublicUrl(fileName);
        setter(data.publicUrl);
    } catch (err: any) { alert("Error al subir imagen: " + err.message); } finally { setIsUploading(false); }
  };

  const exportToPDF = () => {
    // @ts-ignore
    if (!window.jspdf) { alert("Librería PDF no cargada."); return; }
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthlyReservations = reservations.filter(res => {
      const [y, m] = res.date.split('-').map(Number);
      return y === year && (m - 1) === month;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // @ts-ignore
    const doc = new window.jspdf.jsPDF();
    doc.setFontSize(18);
    doc.text(`${config.app_name} - ${MONTHS[month]} ${year}`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generado: ${new Date().toLocaleDateString()}`, 14, 30);
    const tableColumn = ["Fecha", "Hora", "Espacio", "Responsable", "Motivo", "Estado"];
    const tableRows = monthlyReservations.map(res => [
        res.date, res.time, res.space_name, res.full_name, res.reason,
        res.status === 'confirmed' ? 'Confirmado' : (res.status === 'pending' ? 'Pendiente' : 'Rechazado')
    ]);
    // @ts-ignore
    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 40, styles: { fontSize: 8 }, headStyles: { fillColor: config.primary_color } });
    doc.save(`reservas_${MONTHS[month]}_${year}.pdf`);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpace || !user) return;
    setBookingError('');
    const [y, m, d] = bookingForm.date.split('-').map(Number);
    const selectedDate = new Date(y, m - 1, d);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (selectedDate < today) { setBookingError('La fecha seleccionada no puede ser anterior a hoy.'); return; }

    const newRes = {
      id: generateId(),
      space_id: selectedSpace.id,
      space_name: selectedSpace.name,
      ...bookingForm,
      created_at: Date.now(),
      status: 'pending',
      user_email: user.email
    };

    const { error } = await supabaseClient.from('reservations').insert([newRes]);
    if (error) setBookingError('Error al guardar: ' + error.message);
    else { setIsBookingModalOpen(false); setActiveTab('my-bookings'); alert('Solicitud enviada con éxito.'); fetchReservations(); }
  };

  const updateReservationStatus = async (id: string, status: 'confirmed' | 'rejected') => {
    const { error } = await supabaseClient.from('reservations').update({ status }).eq('id', id);
    if (!error) fetchReservations();
  };

  const handleSpaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return;
    if (!spaceForm.name.trim()) { alert("Por favor, ingresa un nombre para el espacio."); return; }
    if (spaceForm.capacity < 1) { alert("La capacidad debe ser al menos de 1 persona."); return; }
    setIsDataLoading(true);

    const featuresArray = spaceForm.features.split(',').map(f => f.trim()).filter(f => f !== '');
    const spaceData = {
      name: spaceForm.name.trim(),
      description: spaceForm.description.trim(),
      capacity: spaceForm.capacity,
      image: spaceForm.image || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=800', 
      features: featuresArray
    };

    try {
        if (editingSpace) {
            const { error } = await supabaseClient.from('spaces').update(spaceData).eq('id', editingSpace.id);
            if (error) throw error;
        } else {
            const { error } = await supabaseClient.from('spaces').insert([{ id: generateId(), ...spaceData }]);
            if (error) throw error;
        }
        setIsSpaceModalOpen(false); 
        await fetchSpaces();
    } catch (err: any) { alert("Error al guardar espacio: " + err.message); } finally { setIsDataLoading(false); }
  };

  const handleDeleteSpace = async (id: string) => {
    const { count } = await supabaseClient.from('reservations').select('*', { count: 'exact', head: true }).eq('space_id', id);
    let msg = "¿Estás seguro de que quieres eliminar este espacio?";
    if (count && count > 0) msg = `⚠️ Hay ${count} reservas asociadas. Se borrarán también.\n\n${msg}`;
    if (!window.confirm(msg)) return;
    
    setIsDataLoading(true);
    try {
        const { error: resError } = await supabaseClient.from('reservations').delete().eq('space_id', id);
        if (resError) throw new Error("Error borrando reservas.");
        const { error: spaceError } = await supabaseClient.from('spaces').delete().eq('id', id);
        if (spaceError) throw new Error("Error borrando espacio: " + spaceError.message);
        alert("Espacio eliminado.");
        await fetchSpaces(); 
    } catch(err: any) { alert(err.message); } finally { setIsDataLoading(false); }
  };

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return;
    const { error } = await supabaseClient.from('app_config').update({
        app_name: configForm.app_name,
        primary_color: configForm.primary_color,
        icon_url: configForm.icon_url,
        updated_at: Date.now()
    }).eq('id', 1);
    if (error) alert('Error: ' + error.message);
    else { alert('Configuración actualizada.'); fetchConfig(); }
  };

  const handleAddModerator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModeratorEmail.includes('@')) { alert("Introduce un correo válido."); return; }
    setIsDataLoading(true);
    const { error } = await supabaseClient.from('user_roles').insert([{ email: newModeratorEmail.toLowerCase().trim(), role: 'moderator' }]);
    setIsDataLoading(false);
    if (error) {
        if (error.code === '23505') alert("Este usuario ya es moderador.");
        else alert("Error al añadir moderador: " + error.message);
    } else {
        setNewModeratorEmail('');
        fetchModerators();
        alert("Moderador añadido. El usuario tendrá acceso al recargar la app.");
    }
  };

  const handleRemoveModerator = async (email: string) => {
    if (!window.confirm(`¿Quitar permisos de moderador a ${email}?`)) return;
    setIsDataLoading(true);
    const { error } = await supabaseClient.from('user_roles').delete().eq('email', email);
    setIsDataLoading(false);
    if (error) alert("Error: " + error.message);
    else { fetchModerators(); }
  };

  const openSpaceModal = (space?: Space) => {
    if (space) { setEditingSpace(space); setSpaceForm({ name: space.name, description: space.description, capacity: space.capacity, features: space.features.join(', '), image: space.image }); } 
    else { setEditingSpace(null); setSpaceForm({ name: '', description: '', capacity: 0, features: '', image: '' }); }
    setIsSpaceModalOpen(true);
  };
  const openBookingModal = (space: Space) => { setSelectedSpace(space); setBookingError(''); setBookingForm({ ...bookingForm, date: '', time: '', reason: '', full_name: '' }); setIsBookingModalOpen(true); };

  if (!isAppReady) return <div className="text-white text-center mt-20"><i className="fas fa-spinner fa-spin"></i> Conectando...</div>;
  if (!user) return <AuthScreen supabase={supabaseClient} config={config} />;

  // --- SHARED CALENDAR VIEW ---
  const renderCalendarView = (isInteractiveAdmin = false) => {
    return (
      <div className="animate-[fadeIn_0.5s_ease]">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="text-white hover:bg-white/10 w-8 h-8 rounded-full"><i className="fas fa-chevron-left"></i></button>
            <h2 className="text-2xl font-bold text-white shadow-sm">{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="text-white hover:bg-white/10 w-8 h-8 rounded-full"><i className="fas fa-chevron-right"></i></button>
          </div>
          <button onClick={exportToPDF} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-all flex items-center gap-2 text-xs md:text-sm">
            <i className="fas fa-file-pdf"></i> <span className="hidden md:inline">Exportar PDF</span>
          </button>
        </div>
        <GlassCard className="!p-0 overflow-hidden">
          <div className="grid grid-cols-7 text-center py-2 border-b border-white/10" style={{ backgroundColor: hexToRgba(config.primary_color, 0.3) }}>
            {DAYS_OF_WEEK.map(d => <div key={d} className="text-white/80 font-bold text-sm uppercase">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 auto-rows-fr bg-white/40">
            {(() => { 
              const year = currentDate.getFullYear(); 
              const month = currentDate.getMonth(); 
              const days = new Date(year, month + 1, 0).getDate(); 
              const firstDay = new Date(year, month, 1).getDay(); 
              const slots = []; 
              
              for (let i = 0; i < firstDay; i++) {
                slots.push(<div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-white/20 bg-slate-50/20"></div>); 
              }
              
              for (let i = 1; i <= days; i++) { 
                const dStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`; 
                
                // Smart filtering based on role
                const dayRes = reservations.filter(r => {
                   const isDateMatch = r.date === dStr;
                   if (!isDateMatch) return false;
                   
                   if (isInteractiveAdmin) return true; // Admins see everything
                   
                   // Users see:
                   // 1. Confirmed reservations (to know availability)
                   // 2. Their OWN reservations (Pending/Rejected/Confirmed)
                   return r.status === 'confirmed' || r.user_email === user?.email;
                });

                const isToday = new Date().toDateString() === new Date(year, month, i).toDateString(); 
                
                slots.push(
                  <div key={i} className="min-h-[100px] border-b border-r border-white/20 p-2 hover:bg-white/30 transition-colors flex flex-col gap-1">
                    <span className={`text-xs font-bold ${isToday ? 'text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-700'}`} style={isToday ? {backgroundColor: config.primary_color} : {}}>{i}</span>
                    <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px]">
                      {dayRes.map(r => (
                        <div key={r.id} className={`text-[10px] px-1 py-0.5 rounded truncate border shadow-sm ${r.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : r.status === 'pending' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                          {r.time.slice(0,5)} {r.space_name}
                        </div>
                      ))}
                    </div>
                  </div>
                ); 
              } 
              return slots; 
            })()}
          </div>
        </GlassCard>
      </div>
    );
  };

  // Render Functions for Views
  const renderUserDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-[fadeIn_0.5s_ease]">
      {spaces.map(space => (
        <GlassCard key={space.id} className="flex flex-col h-full !p-0 overflow-hidden group hover:bg-white/40 transition-all duration-300">
          <div className="h-48 overflow-hidden relative">
            <img src={space.image} alt={space.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-slate-800 text-xs font-bold px-2 py-1 rounded-full shadow-sm"><i className="fas fa-users mr-1" style={{ color: config.primary_color }}></i> {space.capacity} pax</div>
          </div>
          <div className="p-5 flex-grow flex flex-col">
            <h3 className="text-lg font-bold text-white mb-1 drop-shadow-md">{space.name}</h3>
            <p className="text-sm text-slate-600 mb-4 line-clamp-2">{space.description}</p>
            <div className="flex flex-wrap gap-2 mb-6">{space.features.map(f => (<span key={f} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200">{f}</span>))}</div>
            <button onClick={() => openBookingModal(space)} style={{ color: config.primary_color, borderColor: hexToRgba(config.primary_color, 0.3) }} className="mt-auto w-full py-2 bg-white border font-bold rounded-lg hover:text-white transition-all shadow-sm hover:opacity-90" onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = config.primary_color; e.currentTarget.style.color = 'white'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = config.primary_color; }}>Reservar</button>
          </div>
        </GlassCard>
      ))}
    </div>
  );

  const renderAdminDashboard = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const activeToday = reservations.filter(r => r.date === todayStr && r.status === 'confirmed');
    const filteredReservations = reservations.filter(r => (adminDateFilter ? r.date === adminDateFilter : true) && (adminStatusFilter === 'all' ? true : r.status === adminStatusFilter));
    const filteredSpaces = spaces.filter(space => space.name.toLowerCase().includes(adminSpaceNameFilter.toLowerCase()) && (adminSpaceCapacityFilter ? space.capacity >= parseInt(adminSpaceCapacityFilter) : true));

    return (
      <div className="space-y-8 animate-[fadeIn_0.5s_ease]">
        <div className="flex justify-center mb-6">
          <div className="bg-white/20 p-1 rounded-lg flex gap-1 flex-wrap justify-center">
            {['reservations', 'calendar', 'spaces', 'settings'].map((tab) => (
               <button key={tab} onClick={() => setAdminTab(tab as any)} style={adminTab === tab ? { color: config.primary_color } : {}} className={`px-4 py-2 rounded text-sm font-bold transition ${adminTab === tab ? 'bg-white shadow' : 'text-white hover:bg-white/10'}`}>
               <i className={`fas fa-${tab === 'reservations' ? 'list-check' : tab === 'calendar' ? 'calendar-alt' : tab === 'spaces' ? 'building' : 'cog'} mr-2`}></i> {tab === 'reservations' ? 'Solicitudes' : tab === 'calendar' ? 'Calendario' : tab === 'spaces' ? 'Salones' : 'Configuración'}
             </button>
            ))}
          </div>
        </div>

        {adminTab === 'reservations' ? (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <GlassCard className="flex items-center justify-between"><div><p className="text-sm text-white font-bold uppercase drop-shadow-md">Pendientes</p><p className="text-3xl font-bold text-orange-500 drop-shadow-sm">{reservations.filter(r => r.status === 'pending').length}</p></div><div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-500"><i className="fas fa-clock text-xl"></i></div></GlassCard>
              <GlassCard className="flex items-center justify-between"><div><p className="text-sm text-white font-bold uppercase drop-shadow-md">Total</p><p className="text-3xl font-bold drop-shadow-sm" style={{ color: config.primary_color }}>{reservations.length}</p></div><div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary-light text-primary"><i className="fas fa-database text-xl"></i></div></GlassCard>
            </div>
            <div className="mb-8"><h3 className="text-white font-bold text-lg mb-4 drop-shadow-md flex items-center"><i className="fas fa-calendar-day mr-2"></i> Ocupación de Hoy ({todayStr})</h3>{activeToday.length === 0 ? (<GlassCard className="text-center text-white/70 py-4 italic"><p>No hay eventos confirmados para hoy.</p></GlassCard>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{activeToday.map(r => (<GlassCard key={r.id} className="border-l-4 border-l-emerald-500 flex flex-col justify-between"><div><div className="flex justify-between items-start"><h4 className="font-bold text-sm text-white drop-shadow-md">{r.space_name}</h4><span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Activo</span></div><p className="text-lg font-bold text-slate-700 my-1">{r.time} <span className="text-xs font-normal text-slate-500">({r.duration})</span></p><p className="text-xs text-slate-600 line-clamp-2 mb-2 italic">"{r.reason}"</p></div><div className="border-t border-slate-100 pt-2 mt-auto"><p className="text-xs text-slate-400">Responsable:</p><p className="text-xs font-bold" style={{ color: config.primary_color }}>{r.full_name}</p></div></GlassCard>))}</div>)}</div>
            <GlassCard className="mb-6 p-4"><div className="flex flex-col md:flex-row gap-4 items-end"><div className="flex-1 w-full"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Filtrar por Fecha</label><input type="date" value={adminDateFilter} onChange={(e) => setAdminDateFilter(e.target.value)} className="w-full p-2 rounded bg-slate-50 border border-slate-200 outline-none focus:border-primary" /></div><div className="flex-1 w-full"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Filtrar por Estado</label><select value={adminStatusFilter} onChange={(e) => setAdminStatusFilter(e.target.value as any)} className="w-full p-2 rounded bg-slate-50 border border-slate-200 outline-none focus:border-primary"><option value="all">Todos (Historial)</option><option value="pending">Pendientes (Feed)</option><option value="confirmed">Aprobados</option><option value="rejected">Rechazados</option></select></div><div className=""><button onClick={() => {setAdminDateFilter(''); setAdminStatusFilter('all');}} className="px-4 py-2 rounded bg-slate-200 text-slate-600 font-bold hover:bg-slate-300 transition">Limpiar</button></div></div></GlassCard>
            <div className="space-y-4">{filteredReservations.length === 0 ? (<div className="text-center text-white/70 py-10 font-bold">No se encontraron reservas con estos filtros.</div>) : (filteredReservations.map(res => (<GlassCard key={res.id} className={`border-l-4 ${res.status === 'confirmed' ? 'border-l-emerald-500' : res.status === 'rejected' ? 'border-l-red-500' : 'border-l-orange-400'}`}><div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4"><div><div className="flex items-center gap-2 mb-1"><h4 className="font-bold text-lg text-white drop-shadow-md">{res.space_name}</h4><StatusBadge status={res.status} /></div><p className="text-sm text-slate-600 font-semibold">{res.full_name} <span className="font-normal text-slate-500">solicita para</span> {res.reason}</p><div className="mt-2 flex gap-4 text-xs text-slate-500"><span><i className="fas fa-calendar"></i> {res.date}</span><span><i className="fas fa-clock"></i> {res.time} ({res.duration})</span><span style={{ color: config.primary_color }}><i className="fas fa-envelope"></i> {res.user_email}</span></div></div><div className="flex gap-2"><button onClick={() => updateReservationStatus(res.id, 'confirmed')} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded shadow text-sm font-bold transition-colors"><i className="fas fa-check mr-1"></i></button><button onClick={() => updateReservationStatus(res.id, 'rejected')} className="flex-1 bg-white border border-red-200 text-red-500 hover:bg-red-50 px-4 py-2 rounded shadow-sm text-sm font-bold transition-colors"><i className="fas fa-times mr-1"></i></button></div></div></GlassCard>)))}</div>
          </div>
        ) : adminTab === 'calendar' ? (
           renderCalendarView(true)
        ) : adminTab === 'spaces' ? (
          <div>
            <div className="flex justify-between items-center mb-6"><h3 className="text-white font-bold text-xl drop-shadow-sm">Mis Espacios</h3><button onClick={() => openSpaceModal()} style={{ backgroundColor: config.primary_color }} className="text-white px-4 py-2 rounded-lg shadow-lg font-bold transition transform active:scale-95 hover:opacity-90"><i className="fas fa-plus mr-2"></i> Nuevo Espacio</button></div>
            <GlassCard className="mb-6 p-4"><div className="flex flex-col md:flex-row gap-4 items-end"><div className="flex-1 w-full"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Buscar por Nombre</label><input type="text" placeholder="Ej. Salón..." value={adminSpaceNameFilter} onChange={(e) => setAdminSpaceNameFilter(e.target.value)} className="w-full p-2 rounded bg-slate-50 border border-slate-200 outline-none focus:border-primary" /></div><div className="flex-1 w-full"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Capacidad Mínima</label><input type="number" placeholder="Ej. 10" value={adminSpaceCapacityFilter} onChange={(e) => setAdminSpaceCapacityFilter(e.target.value)} className="w-full p-2 rounded bg-slate-50 border border-slate-200 outline-none focus:border-primary" /></div><div className=""><button onClick={() => {setAdminSpaceNameFilter(''); setAdminSpaceCapacityFilter('');}} className="px-4 py-2 rounded bg-slate-200 text-slate-600 font-bold hover:bg-slate-300 transition">Limpiar</button></div></div></GlassCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{filteredSpaces.length === 0 ? (<div className="col-span-full text-center text-white/70 py-10 font-bold">No se encontraron salones que coincidan.</div>) : (filteredSpaces.map(space => (<GlassCard key={space.id} className="relative group"><div className="flex gap-4"><img src={space.image} className="w-24 h-24 object-cover rounded-lg bg-slate-100" alt="" /><div className="flex-1"><h4 className="font-bold text-lg text-white drop-shadow-md">{space.name}</h4><p className="text-xs text-slate-500 mb-2">{space.capacity} pax | {space.features.length} características</p><p className="text-xs text-slate-600 line-clamp-2">{space.description}</p></div></div><div className="mt-4 flex gap-2 border-t border-slate-100 pt-3"><button onClick={() => openSpaceModal(space)} className="flex-1 hover:bg-slate-50 py-1 rounded text-sm font-bold text-primary"><i className="fas fa-edit mr-1"></i> Editar</button><button onClick={() => handleDeleteSpace(space.id)} className="flex-1 text-red-500 hover:bg-red-50 py-1 rounded text-sm font-bold"><i className="fas fa-trash-alt mr-1"></i> Borrar</button></div></GlassCard>)))}</div>
          </div>
        ) : (
          <div className="space-y-6">
            <GlassCard className="max-w-2xl mx-auto">
               <h3 className="text-xl font-bold text-white mb-6 border-b border-white/20 pb-2 drop-shadow-md">Configuración General</h3>
               <form onSubmit={handleConfigSubmit} className="space-y-6">
                  <div><label className="block text-sm font-bold text-slate-600 mb-2">Nombre de la Parroquia / App</label><input type="text" value={configForm.app_name} onChange={e => setConfigForm({...configForm, app_name: e.target.value})} className="w-full p-3 border rounded-lg bg-slate-50 focus:border-primary outline-none" required /></div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-2">Tema Visual y Colores</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {APP_THEMES.map(theme => (
                        <button key={theme.color} type="button" onClick={() => setConfigForm({...configForm, primary_color: theme.color})} className={`p-3 rounded-lg border flex items-center gap-2 transition-all group ${configForm.primary_color === theme.color ? 'ring-2 ring-offset-2 ring-slate-400 bg-slate-50 border-transparent shadow-sm' : 'hover:bg-slate-50 hover:border-slate-300'}`}>
                          <div className="w-8 h-8 rounded-full shadow-sm border border-black/5 flex-shrink-0" style={{backgroundColor: theme.color}}></div>
                          <span className={`text-xs font-bold ${configForm.primary_color === theme.color ? 'text-slate-800' : 'text-slate-500 group-hover:text-slate-700'}`}>{theme.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div><label className="block text-sm font-bold text-slate-600 mb-2">URL del Icono / Logo (Opcional)</label><div className="flex flex-col gap-2"><input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'config', (val) => setConfigForm({...configForm, icon_url: val}))} className="w-full p-2 border rounded bg-slate-50 text-sm" /><p className="text-xs text-slate-400 font-bold uppercase">O pegar URL:</p><input type="url" placeholder="https://..." value={configForm.icon_url} onChange={e => setConfigForm({...configForm, icon_url: e.target.value})} className="w-full p-3 border rounded-lg bg-slate-50 focus:border-primary outline-none" /></div>{isUploading && <p className="text-xs text-blue-500 font-bold animate-pulse"><i className="fas fa-cloud-upload-alt"></i> Subiendo imagen...</p>}{configForm.icon_url && <img src={configForm.icon_url} alt="Preview" className="mt-2 h-16 w-16 object-contain border rounded p-1 bg-white" />}</div>
                  <button disabled={isUploading} type="submit" style={{ backgroundColor: config.primary_color }} className={`w-full py-3 text-white font-bold rounded-lg shadow-md hover:opacity-90 transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>{isUploading ? 'Subiendo...' : 'Guardar Cambios'}</button>
               </form>
            </GlassCard>

            {user?.role === 'admin' && (
                <GlassCard className="max-w-2xl mx-auto border-t-4 border-t-slate-500">
                    <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                        <i className="fas fa-users-cog text-slate-500"></i> Gestión de Moderadores
                    </h3>
                    <p className="text-sm text-slate-600 mb-6 bg-slate-50 p-3 rounded border">
                        Los moderadores tienen acceso al calendario, reservas, gestión de espacios y configuración general, pero <strong>no pueden</strong> añadir ni borrar otros moderadores.
                    </p>
                    
                    <form onSubmit={handleAddModerator} className="flex gap-2 mb-6">
                        <input type="email" required placeholder="Correo del nuevo moderador (debe estar registrado)" value={newModeratorEmail} onChange={e => setNewModeratorEmail(e.target.value)} className="flex-1 p-3 border rounded-lg bg-slate-50 focus:border-primary outline-none" />
                        <button disabled={isDataLoading} type="submit" className="bg-slate-800 text-white px-6 rounded-lg font-bold hover:bg-slate-700 transition">{isDataLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plus"></i>} Añadir</button>
                    </form>

                    <div className="space-y-2">
                        <h4 className="text-sm font-bold text-slate-500 uppercase">Moderadores Activos</h4>
                        {moderators.length === 0 ? (<p className="text-sm text-slate-400 italic">No hay moderadores asignados.</p>) : (moderators.map(mod => (<div key={mod.email} className="flex justify-between items-center p-3 bg-white border rounded-lg shadow-sm"><span className="font-medium text-slate-700">{mod.email}</span><button onClick={() => handleRemoveModerator(mod.email)} className="text-red-500 hover:text-red-700 text-sm font-bold px-3 py-1 rounded hover:bg-red-50 transition"><i className="fas fa-trash-alt mr-1"></i> Quitar</button></div>)))}
                    </div>
                </GlassCard>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-12 transition-colors duration-500">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm px-4 h-16 flex items-center justify-between max-w-7xl mx-auto rounded-b-xl mt-0 md:mt-2 md:rounded-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg overflow-hidden" style={{ backgroundColor: config.primary_color }}>
            {config.icon_url ? <img src={config.icon_url} className="w-full h-full object-cover p-1" /> : <i className="fas fa-church text-sm"></i>}
          </div>
          <span className="font-bold text-primary text-lg hidden sm:block">{config.app_name}</span>
        </div>

        <div className="flex items-center gap-3">
          {(user.role === 'admin' || user.role === 'moderator') && (
            <button onClick={() => setRole(r => r === 'user' ? (user.role) : 'user')} className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full font-bold hover:bg-slate-200 transition border border-slate-200">
               {role === 'user' ? '👑 Ir a Admin' : '👤 Ver como Usuario'}
            </button>
          )}
          <div className="hidden md:flex flex-col items-end mr-2"><span className="text-xs font-bold text-slate-700">{user?.email?.split('@')[0] || 'Usuario'}</span></div>
          <div className="h-6 w-px bg-slate-300 mx-1"></div>
          <button onClick={handleLogout} className="w-10 h-10 rounded-full hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-slate-400 transition-colors" title="Cerrar Sesión"><i className="fas fa-sign-out-alt text-lg"></i></button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-6 mt-4">
        {role === 'user' ? (
          <>
            <div className="flex justify-center mb-8">
              <div className="bg-black/20 backdrop-blur-sm p-1 rounded-xl flex gap-1">
                <button onClick={() => setActiveTab('dashboard')} style={activeTab === 'dashboard' ? { color: config.primary_color } : {}} className={`px-4 md:px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white shadow-md' : 'text-white/80 hover:bg-white/10'}`}>Espacios</button>
                <button onClick={() => setActiveTab('calendar')} style={activeTab === 'calendar' ? { color: config.primary_color } : {}} className={`px-4 md:px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'calendar' ? 'bg-white shadow-md' : 'text-white/80 hover:bg-white/10'}`}>Calendario</button>
                <button onClick={() => setActiveTab('my-bookings')} style={activeTab === 'my-bookings' ? { color: config.primary_color } : {}} className={`px-4 md:px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'my-bookings' ? 'bg-white shadow-md' : 'text-white/80 hover:bg-white/10'}`}>Mis Reservas</button>
              </div>
            </div>
            
            {activeTab === 'dashboard' ? renderUserDashboard() : 
             activeTab === 'calendar' ? renderCalendarView(false) :
             <div className="space-y-4 animate-[fadeIn_0.5s_ease]">
               {!isDataLoading && reservations.filter(r => r.user_email === user.email).length === 0 ? (<div className="text-center py-20 text-white/70"><i className="fas fa-calendar-times text-6xl mb-4 opacity-50"></i><p className="text-xl">No tienes reservas.</p></div>) : (reservations.filter(r => r.user_email === user.email).map(res => (<GlassCard key={res.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div><div className="flex items-center gap-3 mb-1"><h4 className="font-bold text-lg text-white drop-shadow-md">{res.space_name}</h4><StatusBadge status={res.status} /></div><p className="text-sm text-slate-600 font-medium mb-1">{res.reason}</p><div className="flex flex-wrap text-xs text-slate-500 gap-x-4 gap-y-1"><span>{res.date}</span><span>{res.time}</span></div></div></GlassCard>)))}
             </div>
            }
          </>
        ) : (
          renderAdminDashboard()
        )}
      </main>

      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity ${isBookingModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {isBookingModalOpen && (
          <GlassCard className="w-full max-w-lg bg-white/95 animate-[fadeIn_0.3s_ease-out]">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2"><h3 className="text-xl font-bold text-primary">Reservar: {selectedSpace?.name}</h3><button onClick={() => setIsBookingModalOpen(false)} className="text-slate-400 hover:text-slate-600"><i className="fas fa-times text-xl"></i></button></div>
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Responsable</label><input required type="text" className="w-full p-2 rounded bg-slate-50 border border-slate-200 outline-none" value={bookingForm.full_name} onChange={e => setBookingForm({...bookingForm, full_name: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha</label><input required type="date" className="w-full p-2 rounded bg-slate-50 border border-slate-200 outline-none" value={bookingForm.date} onChange={e => setBookingForm({...bookingForm, date: e.target.value})} /></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hora</label><input required type="time" className="w-full p-2 rounded bg-slate-50 border border-slate-200 outline-none" value={bookingForm.time} onChange={e => setBookingForm({...bookingForm, time: e.target.value})} /></div></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Duración</label><select className="w-full p-2 rounded bg-slate-50 border border-slate-200 outline-none" value={bookingForm.duration} onChange={e => setBookingForm({...bookingForm, duration: e.target.value})}>{DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Propósito</label><textarea required rows={3} className="w-full p-2 rounded bg-slate-50 border border-slate-200 outline-none resize-none" value={bookingForm.reason} onChange={e => setBookingForm({...bookingForm, reason: e.target.value})} /></div>
              {bookingError && <div className="bg-red-50 text-red-600 p-2 text-sm">{bookingError}</div>}
              <button type="submit" style={{ backgroundColor: config.primary_color }} className="w-full py-3 text-white font-bold rounded-lg shadow-md hover:opacity-90">Confirmar</button>
            </form>
          </GlassCard>
        )}
      </div>

      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity ${isSpaceModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {isSpaceModalOpen && (
          <GlassCard className="w-full max-w-lg bg-white/95 animate-[fadeIn_0.3s_ease-out] max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2"><h3 className="text-xl font-bold text-primary">{editingSpace ? 'Editar Salón' : 'Nuevo Salón'}</h3><button onClick={() => setIsSpaceModalOpen(false)} className="text-slate-400 hover:text-slate-600"><i className="fas fa-times text-xl"></i></button></div>
            <form onSubmit={handleSpaceSubmit} className="space-y-4">
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre</label><input required type="text" className="w-full p-2 rounded bg-slate-50 border border-slate-200 outline-none" value={spaceForm.name} onChange={e => setSpaceForm({...spaceForm, name: e.target.value})} /></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Imagen del Salón</label><div className="flex flex-col gap-2"><input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'spaces', (val) => setSpaceForm({...spaceForm, image: val}))} className="w-full p-2 border rounded bg-slate-50 text-sm" /><p className="text-xs text-slate-400 font-bold uppercase">O pegar URL:</p><input type="url" placeholder="https://..." value={spaceForm.image} onChange={e => setSpaceForm({...spaceForm, image: e.target.value})} className="w-full p-2 rounded bg-slate-50 border border-slate-200 outline-none" /></div>{isUploading && <p className="text-xs text-blue-500 font-bold animate-pulse"><i className="fas fa-cloud-upload-alt"></i> Subiendo imagen...</p>}{spaceForm.image && (<div className="mt-2 w-full h-32 bg-slate-100 rounded overflow-hidden border"><img src={spaceForm.image} alt="Preview" className="w-full h-full object-cover" /></div>)}</div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Capacidad</label><input required type="number" className="w-full p-2 rounded bg-slate-50 border border-slate-200 outline-none" value={spaceForm.capacity} onChange={e => setSpaceForm({...spaceForm, capacity: parseInt(e.target.value) || 0})} /></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción</label><textarea required className="w-full p-2 rounded bg-slate-50 border border-slate-200 outline-none" value={spaceForm.description} onChange={e => setSpaceForm({...spaceForm, description: e.target.value})} /></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Características</label><input type="text" placeholder="Ej: WiFi, Proyector, Aire Acondicionado..." className="w-full p-2 rounded bg-slate-50 border border-slate-200 outline-none" value={spaceForm.features} onChange={e => setSpaceForm({...spaceForm, features: e.target.value})} /></div>
              <button disabled={isUploading} type="submit" style={{ backgroundColor: config.primary_color }} className={`w-full py-3 text-white font-bold rounded-lg shadow-md hover:opacity-90 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>{editingSpace ? 'Guardar' : 'Crear'}</button>
            </form>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default App;