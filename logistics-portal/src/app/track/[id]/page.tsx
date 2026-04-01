'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

// Language options
const languages = [
  { code: 'EN', name: 'English' },
  { code: 'ES', name: 'Español' },
  { code: 'FR', name: 'Français' },
  { code: 'DE', name: 'Deutsch' },
  { code: 'CN', name: '中文' },
  { code: 'AR', name: 'العربية' },
]

// Translations
const translations = {
  EN: {
    trackYourPackage: 'Track Your Package',
    typeTrackingNumber: 'Type your tracking number',
    track: 'Track',
    currentlyViewing: 'Currently viewing',
    shipmentStatus: 'Shipment Status',
    trackingId: 'Tracking ID',
    lastUpdated: 'Last Updated',
    from: 'From',
    to: 'To',
    trackingTimeline: 'Tracking Timeline',
    currentLocation: 'Current Location',
    estimatedDelivery: 'Estimated Delivery',
    status: 'Status',
    refreshStatus: 'Refresh Status',
    dataUpdates: 'Data updates every few minutes',
    lastChecked: 'Last checked',
    needHelp: 'Need help with your shipment?',
    contactSupport: 'Contact Support',
    trackingNotFound: 'Tracking Not Found',
    tryAnother: 'Try another tracking number',
    backToHome: '← Back to Home',
    loading: 'Loading tracking information...',
    aboutUs: 'About Us',
    services: 'Services',
    trackParcel: 'Track Parcel',
    contact: 'Contact',
    whatClientsSay: 'What Our Clients Say',
    trustedBy: 'Trusted by businesses worldwide',
    quickLinks: 'Quick Links',
    getQuote: 'Get Quote',
    support: 'Support',
    helpCenter: 'Help Center',
    contactUs: 'Contact Us',
    faqs: 'FAQs',
    liveChat: 'Live Chat',
    legal: 'Legal',
    terms: 'Terms & Conditions',
    privacy: 'Privacy Policy',
    cookiePolicy: 'Cookie Policy',
    staffPortal: 'Staff Portal',
    allRightsReserved: 'All rights reserved',
    companyDescription: 'Your trusted partner for global logistics and supply chain solutions. Real-time tracking, reliable delivery.',
  },
  ES: {
    trackYourPackage: 'Rastrea Tu Paquete',
    typeTrackingNumber: 'Ingresa tu número de rastreo',
    track: 'Rastrear',
    currentlyViewing: 'Viendo actualmente',
    shipmentStatus: 'Estado del Envío',
    trackingId: 'ID de Rastreo',
    lastUpdated: 'Última Actualización',
    from: 'Desde',
    to: 'Hasta',
    trackingTimeline: 'Línea de Tiempo',
    currentLocation: 'Ubicación Actual',
    estimatedDelivery: 'Entrega Estimada',
    status: 'Estado',
    refreshStatus: 'Actualizar Estado',
    dataUpdates: 'Datos actualizados cada pocos minutos',
    lastChecked: 'Última verificación',
    needHelp: '¿Necesitas ayuda con tu envío?',
    contactSupport: 'Contactar Soporte',
    trackingNotFound: 'Rastreo No Encontrado',
    tryAnother: 'Intenta con otro número',
    backToHome: '← Volver al Inicio',
    loading: 'Cargando información de rastreo...',
    aboutUs: 'Nosotros',
    services: 'Servicios',
    trackParcel: 'Rastrear Paquete',
    contact: 'Contacto',
    whatClientsSay: 'Lo Que Dicen Nuestros Clientes',
    trustedBy: 'Confiado por empresas worldwide',
    quickLinks: 'Enlaces Rápidos',
    getQuote: 'Cotización',
    support: 'Soporte',
    helpCenter: 'Centro de Ayuda',
    contactUs: 'Contáctanos',
    faqs: 'Preguntas Frecuentes',
    liveChat: 'Chat en Vivo',
    legal: 'Legal',
    terms: 'Términos y Condiciones',
    privacy: 'Política de Privacidad',
    cookiePolicy: 'Política de Cookies',
    staffPortal: 'Portal de Personal',
    allRightsReserved: 'Todos los derechos reservados',
    companyDescription: 'Tu socio confiable para soluciones logísticas globales. Rastreo en tiempo real, entrega confiable.',
  },
  FR: {
    trackYourPackage: 'Suivre Votre Colis',
    typeTrackingNumber: 'Entrez votre numéro de suivi',
    track: 'Suivre',
    currentlyViewing: 'Consultation actuelle',
    shipmentStatus: 'Statut de l\'Expédition',
    trackingId: 'ID de Suivi',
    lastUpdated: 'Dernière Mise à Jour',
    from: 'De',
    to: 'À',
    trackingTimeline: 'Chronologie de Suivi',
    currentLocation: 'Emplacement Actuel',
    estimatedDelivery: 'Livraison Estimée',
    status: 'Statut',
    refreshStatus: 'Actualiser le Statut',
    dataUpdates: 'Données mises à jour toutes les quelques minutes',
    lastChecked: 'Dernière vérification',
    needHelp: 'Besoin d\'aide avec votre envoi?',
    contactSupport: 'Contacter le Support',
    trackingNotFound: 'Suivi Non Trouvé',
    tryAnother: 'Essayez un autre numéro',
    backToHome: '← Retour à l\'Accueil',
    loading: 'Chargement des informations de suivi...',
    aboutUs: 'À Propos',
    services: 'Services',
    trackParcel: 'Suivre Colis',
    contact: 'Contact',
    whatClientsSay: 'Ce Que Disent Nos Clients',
    trustedBy: 'Fait confiance par des entreprises du monde entier',
    quickLinks: 'Liens Rapides',
    getQuote: 'Devis',
    support: 'Support',
    helpCenter: 'Centre d\'Aide',
    contactUs: 'Contactez-nous',
    faqs: 'FAQ',
    liveChat: 'Chat en Direct',
    legal: 'Légal',
    terms: 'Conditions Générales',
    privacy: 'Politique de Confidentialité',
    cookiePolicy: 'Politique de Cookies',
    staffPortal: 'Portail du Personnel',
    allRightsReserved: 'Tous droits réservés',
    companyDescription: 'Votre partenaire de confiance pour les solutions logistiques mondiales. Suivi en temps réel, livraison fiable.',
  },
  DE: {
    trackYourPackage: 'Paket Verfolgen',
    typeTrackingNumber: 'Sendungsnummer eingeben',
    track: 'Verfolgen',
    currentlyViewing: 'Aktuelle Ansicht',
    shipmentStatus: 'Sendungsstatus',
    trackingId: 'Sendungsnummer',
    lastUpdated: 'Zuletzt Aktualisiert',
    from: 'Von',
    to: 'Nach',
    trackingTimeline: 'Verfolgungszeitlinie',
    currentLocation: 'Aktueller Standort',
    estimatedDelivery: 'Geschätzte Lieferung',
    status: 'Status',
    refreshStatus: 'Status Aktualisieren',
    dataUpdates: 'Daten werden alle paar Minuten aktualisiert',
    lastChecked: 'Zuletzt geprüft',
    needHelp: 'Hilfe bei Ihrer Sendung benötigt?',
    contactSupport: 'Support Kontaktieren',
    trackingNotFound: 'Sendung Nicht Gefunden',
    tryAnother: 'Andere Nummer versuchen',
    backToHome: '← Zurück zur Startseite',
    loading: 'Sendungsinformationen werden geladen...',
    aboutUs: 'Über Uns',
    services: 'Dienstleistungen',
    trackParcel: 'Paket Verfolgen',
    contact: 'Kontakt',
    whatClientsSay: 'Was Unsere Kunden Sagen',
    trustedBy: 'Vertraut von Unternehmen weltweit',
    quickLinks: 'Schnelllinks',
    getQuote: 'Angebot Einholen',
    support: 'Support',
    helpCenter: 'Hilfecenter',
    contactUs: 'Kontaktieren Sie Uns',
    faqs: 'FAQs',
    liveChat: 'Live-Chat',
    legal: 'Rechtliches',
    terms: 'AGB',
    privacy: 'Datenschutzrichtlinie',
    cookiePolicy: 'Cookie-Richtlinie',
    staffPortal: 'Mitarbeiterportal',
    allRightsReserved: 'Alle Rechte vorbehalten',
    companyDescription: 'Ihr vertrauenswürdiger Partner für globale Logistiklösungen. Echtzeit-Tracking, zuverlässige Lieferung.',
  },
  CN: {
    trackYourPackage: '追踪您的包裹',
    typeTrackingNumber: '输入您的追踪号码',
    track: '追踪',
    currentlyViewing: '当前查看',
    shipmentStatus: '货运状态',
    trackingId: '追踪编号',
    lastUpdated: '最后更新',
    from: '从',
    to: '至',
    trackingTimeline: '追踪时间线',
    currentLocation: '当前位置',
    estimatedDelivery: '预计送达',
    status: '状态',
    refreshStatus: '刷新状态',
    dataUpdates: '数据每几分钟更新一次',
    lastChecked: '最后检查',
    needHelp: '需要货运帮助？',
    contactSupport: '联系客服',
    trackingNotFound: '未找到追踪信息',
    tryAnother: '尝试其他号码',
    backToHome: '← 返回首页',
    loading: '正在加载追踪信息...',
    aboutUs: '关于我们',
    services: '服务',
    trackParcel: '追踪包裹',
    contact: '联系我们',
    whatClientsSay: '客户评价',
    trustedBy: '全球企业信赖',
    quickLinks: '快速链接',
    getQuote: '获取报价',
    support: '支持',
    helpCenter: '帮助中心',
    contactUs: '联系我们',
    faqs: '常见问题',
    liveChat: '在线客服',
    legal: '法律条款',
    terms: '条款与条件',
    privacy: '隐私政策',
    cookiePolicy: 'Cookie政策',
    staffPortal: '员工门户',
    allRightsReserved: '版权所有',
    companyDescription: '您值得信赖的全球物流和供应链解决方案合作伙伴。实时追踪，可靠配送。',
  },
  AR: {
    trackYourPackage: 'تتبع شحنتك',
    typeTrackingNumber: 'أدخل رقم التتبع',
    track: 'تتبع',
    currentlyViewing: 'العرض الحالي',
    shipmentStatus: 'حالة الشحنة',
    trackingId: 'رقم التتبع',
    lastUpdated: 'آخر تحديث',
    from: 'من',
    to: 'إلى',
    trackingTimeline: 'الجدول الزمني',
    currentLocation: 'الموقع الحالي',
    estimatedDelivery: 'التسليم المتوقع',
    status: 'الحالة',
    refreshStatus: 'تحديث الحالة',
    dataUpdates: 'يتم تحديث البيانات كل بضع دقائق',
    lastChecked: 'آخر فحص',
    needHelp: 'هل تحتاج مساعدة في شحنتك؟',
    contactSupport: 'الاتصال بالدعم',
    trackingNotFound: 'لم يتم العثور على التتبع',
    tryAnother: 'جرب رقماً آخر',
    backToHome: '← العودة للرئيسية',
    loading: 'جاري تحميل معلومات التتبع...',
    aboutUs: 'من نحن',
    services: 'الخدمات',
    trackParcel: 'تتبع الطرد',
    contact: 'اتصل بنا',
    whatClientsSay: 'آراء عملائنا',
    trustedBy: 'موثوق به من قبل الشركات حول العالم',
    quickLinks: 'روابط سريعة',
    getQuote: 'احصل على عرض',
    support: 'الدعم',
    helpCenter: 'مركز المساعدة',
    contactUs: 'اتصل بنا',
    faqs: 'الأسئلة الشائعة',
    liveChat: 'دردشة مباشرة',
    legal: 'قانوني',
    terms: 'الشروط والأحكام',
    privacy: 'سياسة الخصوصية',
    cookiePolicy: 'سياسة الكوكيز',
    staffPortal: 'بوابة الموظفين',
    allRightsReserved: 'جميع الحقوق محفوظة',
    companyDescription: 'شريكك الموثوق لحلول اللوجستيات العالمية. تتبع فوري، توصيل موثوق.',
  },
}

interface TrackingData {
  id: string
  status: 'received' | 'in-transit' | 'sort-facility' | 'out-delivery' | 'delivered'
  origin: string
  destination: string
  estimatedDelivery: string
  lastUpdated: string
  currentLocation?: string
  timeline: {
    step: string
    label: string
    date: string
    time?: string
    description?: string
    completed: boolean
    active: boolean
  }[]
}

// Testimonials data with lime-green profile rings
const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Supply Chain Manager',
    company: 'TechCorp Inc.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    text: 'Skyship Logistics has transformed our supply chain. Their real-time tracking and reliable delivery times have helped us improve customer satisfaction by 40%.',
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Operations Director',
    company: 'Global Trade Co.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    text: 'The best logistics partner we have worked with. Their express service is exceptional, and their customer support is available 24/7.',
  },
  {
    id: 3,
    name: 'Emma Williams',
    role: 'CEO',
    company: 'FastRetail Ltd.',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    text: 'Their logistics solutions have reduced our operational costs significantly. The tracking system is top-notch and easy to use.',
  },
]

export default function TrackPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLang, setSelectedLang] = useState('EN')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  // Helper function to get translation
  const t = (key: keyof typeof translations['EN']) => {
    return translations[selectedLang as keyof typeof translations]?.[key] || translations['EN'][key]
  }

  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/track/${id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Tracking number not found. Please check your tracking ID and try again.')
          } else {
            setError('Failed to fetch tracking information. Please try again later.')
          }
          return
        }
        
        const data = await response.json()
        
        // Enhance timeline with descriptions and times
        const enhancedTimeline = data.timeline.map((step: any) => ({
          ...step,
          time: step.completed || step.active ? getRandomTime() : undefined,
          description: getStepDescription(step.step, data.origin, data.destination)
        }))
        
        setTrackingData({
          ...data,
          currentLocation: getCurrentLocation(data.status, data.origin, data.destination),
          timeline: enhancedTimeline
        })
      } catch (err) {
        setError('An error occurred while fetching tracking data.')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchTrackingData()
    }
  }, [id])

  const getRandomTime = () => {
    const hours = Math.floor(Math.random() * 12) + 8
    const minutes = Math.floor(Math.random() * 60).toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const getStepDescription = (step: string, origin: string, destination: string) => {
    const descriptions: Record<string, string> = {
      'received': `Package received at ${origin} facility`,
      'in-transit': `In transit to sorting facility`,
      'sort-facility': `Package scanned at sorting hub`,
      'out-delivery': `Out for delivery in ${destination}`,
      'delivered': `Package delivered successfully`
    }
    return descriptions[step] || 'Status update'
  }

  const getCurrentLocation = (status: string, origin: string, destination: string) => {
    const locations: Record<string, string> = {
      'received': origin,
      'in-transit': `En route from ${origin}`,
      'sort-facility': 'Regional Sorting Facility',
      'out-delivery': destination,
      'delivered': destination
    }
    return locations[status] || 'In transit'
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'received': 'Package Received',
      'in-transit': 'In Transit',
      'sort-facility': 'At Sort Facility',
      'out-delivery': 'Out for Delivery',
      'delivered': 'Delivered'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'received': 'bg-yellow-400',
      'in-transit': 'bg-[#C8FF00]',
      'sort-facility': 'bg-blue-400',
      'out-delivery': 'bg-purple-400',
      'delivered': 'bg-green-500'
    }
    return colorMap[status] || 'bg-gray-400'
  }

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault()
    if (trackingNumber.trim()) {
      router.push(`/track/${trackingNumber.trim()}`)
    }
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  if (loading) {
    return (
      <div className="mesh-gradient min-h-screen flex items-center justify-center">
        <div className="glass-panel p-8 text-center">
          <div className="w-16 h-16 border-4 border-[#C8FF00] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mesh-gradient min-h-screen">
        {/* Header */}
        <header className="glass-header fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden">
              <Image
                src="/Gemini_Generated_Image_fdrkvsfdrkvsfdrk.png"
                alt="Skyship Logistics Logo"
                fill
                className="object-cover"
                sizes="40px"
                priority
              />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white text-high-contrast">
              Skyship Logistics
            </span>
          </Link>

            {/* Navigation Links - Desktop */}
            <nav className="hidden md:flex items-center gap-2">
              <Link href="/about" className="nav-link text-sm">{t('aboutUs')}</Link>
              <a href="/#services" className="nav-link text-sm">{t('services')}</a>
              <a href="/#track" className="nav-link text-sm">{t('trackParcel')}</a>
              <Link href="/contact" className="nav-link text-sm">{t('contact')}</Link>
            </nav>

            {/* Language Switcher */}
            <div className="flex items-center gap-3">
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="language-switcher"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="text-gray-900">
                    {lang.code}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* Error Content */}
        <main className="pt-24 sm:pt-32 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="hero-glass p-8 sm:p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl overflow-hidden bg-[#C8FF00]/20 flex items-center justify-center">
                <Image 
                  src="https://images.unsplash.com/photo-1607344649296-a261e3e4b5bf?w=100&q=80" 
                  alt="Package" 
                  width={64} 
                  height={64} 
                  className="object-cover w-full h-full"
                />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">{t('trackingNotFound')}</h1>
              <p className="text-white/70 mb-6">{error}</p>
              
              {/* Tracking Input */}
              <form onSubmit={handleTrack} className="max-w-md mx-auto">
                <label className="block text-white/80 text-sm mb-3 font-medium">
                  {t('tryAnother')}
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g., SK-1234-5678"
                    className="glass-input flex-1 text-base"
                  />
                  <button
                    type="submit"
                    className="skyship-button px-6 py-3 whitespace-nowrap font-bold"
                  >
                    {t('track')}
                  </button>
                </div>
              </form>

              <div className="mt-8">
                <Link href="/" className="glass-button px-6 py-3 inline-block">
                  {t('backToHome')}
                </Link>
              </div>
            </div>
          </div>
        </main>

        {/* Footer - Added to error state */}
        <footer id="contact" className="glass-footer py-12 px-4 sm:px-6 lg:px-8 mt-16 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
              {/* Company Info */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden">
                    <Image
                      src="/Gemini_Generated_Image_fdrkvsfdrkvsfdrk.png"
                      alt="Skyship Logistics Logo"
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <span className="text-xl font-bold text-white">Skyship Logistics</span>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">
                  {t('companyDescription')}
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-white font-semibold mb-4">{t('quickLinks')}</h4>
                <ul className="space-y-2">
                  <li><Link href="/about" className="skyship-footer-link text-sm">{t('aboutUs')}</Link></li>
                  <li><a href="/#services" className="skyship-footer-link text-sm">{t('services')}</a></li>
                  <li><a href="/#track" className="skyship-footer-link text-sm">{t('trackParcel')}</a></li>
                  <li><Link href="/contact" className="skyship-footer-link text-sm">{t('getQuote')}</Link></li>
                </ul>
              </div>

              {/* Support */}
              <div>
                <h4 className="text-white font-semibold mb-4">{t('support')}</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="skyship-footer-link text-sm">{t('helpCenter')}</a></li>
                  <li><a href="#" className="skyship-footer-link text-sm">{t('contactUs')}</a></li>
                  <li><a href="#" className="skyship-footer-link text-sm">{t('faqs')}</a></li>
                  <li><a href="#" className="skyship-footer-link text-sm">{t('liveChat')}</a></li>
                </ul>
              </div>

              {/* Legal & Staff */}
              <div>
                <h4 className="text-white font-semibold mb-4">{t('legal')}</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="skyship-footer-link text-sm">{t('terms')}</a></li>
                  <li><a href="#" className="skyship-footer-link text-sm">{t('privacy')}</a></li>
                  <li><a href="#" className="skyship-footer-link text-sm">{t('cookiePolicy')}</a></li>
                  <li><Link href="/staff" className="skyship-footer-link text-sm">{t('staffPortal')}</Link></li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-white/50 text-sm">
                © 2026 Skyship Logistics. {t('allRightsReserved')}
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-white/50 hover:text-[#9DC400] transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-white/50 hover:text-[#9DC400] transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="#" className="text-white/50 hover:text-[#9DC400] transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    )
  }

  if (!trackingData) {
    return null
  }

  return (
    <div className="mesh-gradient min-h-screen">
      {/* Header & Navigation */}
      <header className="glass-header fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden">
              <Image
                src="/Gemini_Generated_Image_fdrkvsfdrkvsfdrk.png"
                alt="Skyship Logistics Logo"
                fill
                className="object-cover"
                sizes="40px"
                priority
              />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white text-high-contrast">
              Skyship Logistics
            </span>
          </Link>

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center gap-2">
            <Link href="/about" className="nav-link text-sm">{t('aboutUs')}</Link>
            <a href="/#services" className="nav-link text-sm">{t('services')}</a>
            <a href="/#track" className="nav-link text-sm">{t('trackParcel')}</a>
            <Link href="/contact" className="nav-link text-sm">{t('contact')}</Link>
          </nav>

          {/* Language Switcher */}
          <div className="flex items-center gap-3">
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="language-switcher"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code} className="text-gray-900">
                  {lang.code}
                </option>
              ))}
            </select>
            
            {/* Mobile Menu Button */}
            <button className="md:hidden glass-button p-2">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 sm:pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Tracking Input Section - Always visible */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white text-high-contrast mb-6">
              {t('trackYourPackage')}
            </h1>
            
            <form onSubmit={handleTrack} className="hero-glass p-6 sm:p-8 max-w-2xl mx-auto">
              <label className="block text-white/80 text-sm mb-3 font-medium">
                {t('typeTrackingNumber')}
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g., SK-1234-5678"
                  className="glass-input flex-1 text-base"
                />
                <button
                  type="submit"
                  className="skyship-button px-8 py-3 whitespace-nowrap font-bold text-base"
                >
                  {t('track')}
                </button>
              </div>
              <p className="text-white/60 text-xs mt-3">
                {t('currentlyViewing')}: <span className="text-[#C8FF00] font-mono font-bold">{trackingData.id}</span>
              </p>
            </form>
          </div>

          {/* Results Section - Shipment Status Card */}
          <div className="shipment-status-card p-6 sm:p-8 lg:p-10 mb-8">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
              <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${getStatusColor(trackingData.status)} rounded-xl flex items-center justify-center shadow-lg overflow-hidden`}>
                <Image 
                  src="https://images.unsplash.com/photo-1607344649296-a261e3e4b5bf?w=100&q=80" 
                  alt="Package" 
                  width={48} 
                  height={48} 
                  className="object-cover w-full h-full"
                />
              </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">{t('shipmentStatus')}</h2>
                  <p className="text-white/60 text-sm mt-1">{t('trackingId')}: <span className="font-mono text-[#C8FF00]">{trackingData.id}</span></p>
                </div>
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-white/60 text-sm">{t('lastUpdated')}</p>
                <p className="text-white font-semibold">
                  {new Date(trackingData.lastUpdated).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Route Info */}
            <div className="flex items-center justify-center gap-4 sm:gap-8 mb-8 p-4 bg-white/5 rounded-2xl">
              <div className="text-center">
                <p className="text-white/60 text-xs uppercase tracking-wider mb-1">{t('from')}</p>
                <p className="text-white font-bold text-lg">{trackingData.origin}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 sm:w-24 h-0.5 bg-white/20"></div>
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <Image 
                    src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=100&q=80" 
                    alt="Truck" 
                    width={32} 
                    height={32} 
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="w-12 sm:w-24 h-0.5 bg-white/20"></div>
              </div>
              <div className="text-center">
                <p className="text-white/60 text-xs uppercase tracking-wider mb-1">{t('to')}</p>
                <p className="text-white font-bold text-lg">{trackingData.destination}</p>
              </div>
            </div>

            {/* Horizontal Timeline */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#C8FF00] rounded-full animate-pulse"></span>
                {t('trackingTimeline')}
              </h3>
              
              {/* Desktop Horizontal Timeline */}
              <div className="hidden md:block">
                <div className="timeline-horizontal">
                  {trackingData.timeline.map((step, index) => (
                    <div key={step.step} className="timeline-step-horizontal">
                      {/* Node */}
                      <div 
                        className={`timeline-node ${
                          step.active ? 'active' : step.completed ? 'completed' : 'future'
                        }`}
                      >
                        {step.completed ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : index + 1}
                      </div>
                      
                      {/* Content */}
                      <div className="timeline-content">
                        <p className={`timeline-label ${step.active ? 'active' : step.completed ? 'completed' : 'future'}`}>
                          {step.label}
                        </p>
                        <p className="timeline-date">
                          {step.date} {step.time && `• ${step.time}`}
                        </p>
                        <p className="timeline-description">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Vertical Timeline */}
              <div className="md:hidden space-y-6">
                {trackingData.timeline.map((step, index) => (
                  <div key={step.step} className="flex items-start gap-4">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold ${
                        step.active 
                          ? 'bg-[#C8FF00] text-[#001f3f] shadow-lg shadow-[#C8FF00]/50' 
                          : step.completed 
                            ? 'bg-[#C8FF00] text-[#001f3f]' 
                            : 'bg-white/10 text-white/50 border border-white/20'
                      }`}
                    >
                      {step.completed ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : index + 1}
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${step.active || step.completed ? 'text-white' : 'text-white/50'}`}>
                        {step.label}
                      </p>
                      <p className="text-white/60 text-sm">
                        {step.date} {step.time && `• ${step.time}`}
                      </p>
                      <p className="text-white/40 text-xs mt-1">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="glass-panel-dark p-4 rounded-2xl">
                <p className="text-white/60 text-sm mb-1 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full overflow-hidden inline-block">
                    <Image src="https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=50&q=80" alt="Location" width={16} height={16} className="object-cover w-full h-full" />
                  </span> 
                  {t('currentLocation')}
                </p>
                <p className="text-white font-semibold">
                  {trackingData.currentLocation}
                </p>
              </div>
              <div className="glass-panel-dark p-4 rounded-2xl">
                <p className="text-white/60 text-sm mb-1 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full overflow-hidden inline-block">
                    <Image src="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=50&q=80" alt="Calendar" width={16} height={16} className="object-cover w-full h-full" />
                  </span> 
                  {t('estimatedDelivery')}
                </p>
                <p className="text-[#C8FF00] font-semibold">
                  {new Date(trackingData.estimatedDelivery).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="glass-panel-dark p-4 rounded-2xl">
                <p className="text-white/60 text-sm mb-1 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full overflow-hidden inline-block">
                    <Image src="https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=50&q=80" alt="Status" width={16} height={16} className="object-cover w-full h-full" />
                  </span> 
                  {t('status')}
                </p>
                <p className="text-white font-semibold flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${getStatusColor(trackingData.status)} animate-pulse`}></span>
                  {getStatusText(trackingData.status)}
                </p>
              </div>
            </div>

            {/* Refresh Button */}
            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <button 
                onClick={handleRefresh}
                className="glass-button px-8 py-3 inline-flex items-center gap-2 hover:bg-white/20 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t('refreshStatus')}
              </button>
              <p className="text-white/50 text-sm mt-3">
                {t('dataUpdates')} • {t('lastChecked')}: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* Help Section */}
          <div className="text-center mb-12">
            <p className="text-white/60 text-sm">
              {t('needHelp')}{' '}
              <a href="#" className="text-[#C8FF00] hover:text-[#D4FF33] transition font-semibold">
                {t('contactSupport')}
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Testimonials Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white text-high-contrast mb-4">
              What Our Clients Say
            </h2>
            <p className="text-white/70 text-lg">
              Trusted by businesses worldwide
            </p>
          </div>

          {/* Testimonial Slider */}
          <div className="relative">
            <div className="glass-panel p-8 sm:p-12 max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Profile Image with Lime Green Ring */}
                <div className="flex-shrink-0">
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden profile-ring-lime">
                    <Image
                      src={testimonials[currentTestimonial].image}
                      alt={testimonials[currentTestimonial].name}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </div>
                </div>
                
                {/* Content */}
                <div className="text-center md:text-left flex-1">
                  <p className="text-white/90 text-lg sm:text-xl italic mb-6 leading-relaxed">
                    &ldquo;{testimonials[currentTestimonial].text}&rdquo;
                  </p>
                  <div>
                    <p className="text-white font-bold text-lg">
                      {testimonials[currentTestimonial].name}
                    </p>
                    <p className="text-white/60 text-sm">
                      {testimonials[currentTestimonial].role}, {testimonials[currentTestimonial].company}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={prevTestimonial}
                className="glass-button p-3 rounded-full hover:bg-white/20 transition-all"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* Dots */}
              <div className="flex items-center gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`h-3 rounded-full transition-all ${
                      index === currentTestimonial
                        ? 'bg-[#C8FF00] w-8 shadow-lg shadow-[#C8FF00]/50'
                        : 'bg-white/40 hover:bg-white/60 w-3'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextTestimonial}
                className="glass-button p-3 rounded-full hover:bg-white/20 transition-all"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="glass-footer py-12 px-4 sm:px-6 lg:px-8 mt-16 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden">
                  <Image
                    src="/Gemini_Generated_Image_fdrkvsfdrkvsfdrk.png"
                    alt="Skyship Logistics Logo"
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
                <span className="text-xl font-bold text-white">Skyship Logistics</span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                {t('companyDescription')}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">{t('quickLinks')}</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="skyship-footer-link text-sm">{t('aboutUs')}</Link></li>
                <li><a href="/#services" className="skyship-footer-link text-sm">{t('services')}</a></li>
                <li><a href="/#track" className="skyship-footer-link text-sm">{t('trackParcel')}</a></li>
                  <li><Link href="/contact" className="skyship-footer-link text-sm">{t('getQuote')}</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-semibold mb-4">{t('support')}</h4>
              <ul className="space-y-2">
                <li><a href="#" className="skyship-footer-link text-sm">{t('helpCenter')}</a></li>
                <li><a href="#" className="skyship-footer-link text-sm">{t('contactUs')}</a></li>
                <li><a href="#" className="skyship-footer-link text-sm">{t('faqs')}</a></li>
                <li><a href="#" className="skyship-footer-link text-sm">{t('liveChat')}</a></li>
              </ul>
            </div>

            {/* Legal & Staff */}
            <div>
              <h4 className="text-white font-semibold mb-4">{t('legal')}</h4>
              <ul className="space-y-2">
                <li><a href="#" className="skyship-footer-link text-sm">{t('terms')}</a></li>
                <li><a href="#" className="skyship-footer-link text-sm">{t('privacy')}</a></li>
                <li><a href="#" className="skyship-footer-link text-sm">{t('cookiePolicy')}</a></li>
                <li><Link href="/staff" className="skyship-footer-link text-sm">{t('staffPortal')}</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-white/50 text-sm">
              © 2026 Skyship Logistics. {t('allRightsReserved')}
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-white/50 hover:text-[#9DC400] transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="text-white/50 hover:text-[#9DC400] transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="#" className="text-white/50 hover:text-[#9DC400] transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
