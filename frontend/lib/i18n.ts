export type Locale = 'en' | 'es' | 'fr' | 'ar';

export interface LocaleConfig {
  code: Locale;
  label: string;
  nativeLabel: string;
  dir: 'ltr' | 'rtl';
  flag: string;
}

export const supportedLocales: LocaleConfig[] = [
  { code: 'en', label: 'English', nativeLabel: 'English (US)', dir: 'ltr', flag: '🇺🇸' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', dir: 'ltr', flag: '🇪🇸' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', dir: 'ltr', flag: '🇫🇷' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl', flag: '🇸🇦' },
];

export const translations: Record<Locale, Record<string, string>> = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.users': 'Users',
    'nav.roles': 'Roles',
    'nav.permissions': 'Permissions',
    'nav.menus': 'Menu Builder',
    'nav.media': 'Media Manager',
    'nav.settings': 'Site Settings',
    'nav.activity_logs': 'Activity Logs',
    'nav.notifications': 'Notifications',
    'nav.login_history': 'Login History',
    'nav.sessions': 'Active Sessions',
    'nav.health': 'System Health',
    'nav.jobs': 'Background Jobs',
    'nav.profile': 'My Profile',
    'nav.logout': 'Sign Out',
    'common.search': 'Search...',
    'common.filter': 'Filter',
    'common.reset': 'Reset',
    'common.save': 'Save Changes',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.create': 'Create',
    'common.actions': 'Actions',
    'common.status': 'Status',
    'common.created_at': 'Created At',
    'common.loading': 'Loading...',
    'common.empty': 'No records found',
    'common.success': 'Operation successful',
    'common.error': 'An error occurred',
  },
  es: {
    'nav.dashboard': 'Panel de Control',
    'nav.users': 'Usuarios',
    'nav.roles': 'Roles',
    'nav.permissions': 'Permisos',
    'nav.menus': 'Menús',
    'nav.media': 'Archivos Multimedia',
    'nav.settings': 'Configuración',
    'nav.activity_logs': 'Registro de Actividad',
    'nav.notifications': 'Notificaciones',
    'nav.login_history': 'Historial de Inicio de Sesión',
    'nav.sessions': 'Sesiones Activas',
    'nav.health': 'Estado del Sistema',
    'nav.jobs': 'Trabajos en Cola',
    'nav.profile': 'Mi Perfil',
    'nav.logout': 'Cerrar Sesión',
    'common.search': 'Buscar...',
    'common.filter': 'Filtrar',
    'common.reset': 'Restablecer',
    'common.save': 'Guardar Cambios',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.view': 'Ver',
    'common.create': 'Crear',
    'common.actions': 'Acciones',
    'common.status': 'Estado',
    'common.created_at': 'Creado el',
    'common.loading': 'Cargando...',
    'common.empty': 'No se encontraron registros',
    'common.success': 'Operación exitosa',
    'common.error': 'Ocurrió un error',
  },
  fr: {
    'nav.dashboard': 'Tableau de bord',
    'nav.users': 'Utilisateurs',
    'nav.roles': 'Rôles',
    'nav.permissions': 'Permissions',
    'nav.menus': 'Constructeur de Menu',
    'nav.media': 'Médiathèque',
    'nav.settings': 'Paramètres',
    'nav.activity_logs': 'Journaux d’activité',
    'nav.notifications': 'Notifications',
    'nav.login_history': 'Historique de Connexion',
    'nav.sessions': 'Sessions Actives',
    'nav.health': 'Santé du Système',
    'nav.jobs': 'Tâches en file',
    'nav.profile': 'Mon Profil',
    'nav.logout': 'Déconnexion',
    'common.search': 'Rechercher...',
    'common.filter': 'Filtrer',
    'common.reset': 'Réinitialiser',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.view': 'Voir',
    'common.create': 'Créer',
    'common.actions': 'Actions',
    'common.status': 'Statut',
    'common.created_at': 'Créé le',
    'common.loading': 'Chargement...',
    'common.empty': 'Aucun enregistrement trouvé',
    'common.success': 'Opération réussie',
    'common.error': 'Une erreur est survenue',
  },
  ar: {
    'nav.dashboard': 'لوحة التحكم',
    'nav.users': 'المستخدمين',
    'nav.roles': 'الأدوار',
    'nav.permissions': 'الصلاحيات',
    'nav.menus': 'منشئ القوائم',
    'nav.media': 'مدير الوسائط',
    'nav.settings': 'إعدادات الموقع',
    'nav.activity_logs': 'سجل الأنشطة',
    'nav.notifications': 'الإشعارات',
    'nav.login_history': 'سجل تسجيل الدخول',
    'nav.sessions': 'الجلسات النشطة',
    'nav.health': 'صحة النظام',
    'nav.jobs': 'مهام الخلفية',
    'nav.profile': 'ملفي الشخصي',
    'nav.logout': 'تسجيل الخروج',
    'common.search': 'بحث...',
    'common.filter': 'تصفية',
    'common.reset': 'إعادة ضبط',
    'common.save': 'حفظ التغييرات',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.view': 'عرض',
    'common.create': 'إنشاء',
    'common.actions': 'الإجراءات',
    'common.status': 'الحالة',
    'common.created_at': 'تاريخ الإنشاء',
    'common.loading': 'جار التحميل...',
    'common.empty': 'لا توجد سجلات',
    'common.success': 'تمت العملية بنجاح',
    'common.error': 'حدث خطأ ما',
  },
};

export function isRTL(locale: Locale): boolean {
  return locale === 'ar';
}

export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
