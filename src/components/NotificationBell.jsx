import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  subscribeToNotifications, 
  requestPushPermission 
} from "../services/notificationService";
import { useAuthStore } from "../store/useAuthStore";

export function NotificationBell() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sam_read_notifications") || "[]");
    } catch {
      return [];
    }
  });
  const [isPushEnabled, setIsPushEnabled] = useState(() => {
    return typeof window !== "undefined" && Notification?.permission === "granted";
  });

  const dropdownRef = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeToNotifications((notifs) => {
      // Filtrar por rol si aplica
      const userRole = user?.rol || "profesor";
      const filtered = notifs.filter(n => {
        if (!n.recipientRole || n.recipientRole === "all") return true;
        return n.recipientRole === userRole;
      });
      setNotifications(filtered);
    });

    return () => unsubscribe();
  }, [user]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadNotifications = notifications.filter(n => !readIds.includes(n.id));
  const unreadCount = unreadNotifications.length;

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    const newReadIds = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(newReadIds);
    localStorage.setItem("sam_read_notifications", JSON.stringify(newReadIds));
  };

  const handleNotificationClick = (id) => {
    if (!readIds.includes(id)) {
      const newReadIds = [...readIds, id];
      setReadIds(newReadIds);
      localStorage.setItem("sam_read_notifications", JSON.stringify(newReadIds));
    }
    setIsOpen(false);
  };

  const handleEnablePush = async () => {
    const token = await requestPushPermission();
    if (token) {
      setIsPushEnabled(true);
      toast.success("¡Notificaciones móviles / push activadas!");
    } else {
      toast.error("No se pudieron activar las notificaciones push.");
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "attendance_alert":
        return (
          <div className="p-2 bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 rounded-full shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case "observation":
        return (
          <div className="p-2 bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 rounded-full shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
        );
      case "student_update":
        return (
          <div className="p-2 bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400 rounded-full shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded-full shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón Campana */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notificaciones"
        className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-Sam dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Menú Desplegable */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 z-50 overflow-hidden animate-fade-in">
          {/* Header del dropdown */}
          <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Notificaciones</h3>
              {unreadCount > 0 && (
                <span className="bg-Sam/10 text-Sam text-xs font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} nuevas
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-Sam hover:underline font-semibold cursor-pointer"
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          {/* Banner para activar Push */}
          {!isPushEnabled && (
            <div className="p-3 bg-green-50 dark:bg-green-950/30 border-b border-green-100 dark:border-green-900/50 flex items-center justify-between gap-2">
              <div className="text-xs text-green-800 dark:text-green-300">
                ¿Recibir alertas en tu celular / PC?
              </div>
              <button
                onClick={handleEnablePush}
                className="text-xs bg-Sam hover:bg-green-700 text-white font-bold py-1 px-3 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                Activar Push
              </button>
            </div>
          )}

          {/* Lista de Notificaciones */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-700/50">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No hay notificaciones recientes.
              </div>
            ) : (
              notifications.map((n) => {
                const isRead = readIds.includes(n.id);
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n.id)}
                    className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer ${
                      !isRead ? "bg-blue-50/40 dark:bg-slate-700/20" : ""
                    }`}
                  >
                    {getIcon(n.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className={`text-xs font-bold truncate ${!isRead ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>
                          {n.title}
                        </h4>
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-Sam shrink-0 ml-2" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                      {n.targetDoc && (
                        <Link
                          to={`/admin/estudiante/${n.targetDoc}`}
                          className="text-[11px] text-Sam hover:underline font-semibold mt-1 inline-block"
                        >
                          Ver expediente →
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
