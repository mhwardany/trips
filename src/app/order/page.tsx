'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShoppingBag, ImagePlus, CheckCircle2, ChevronRight, Globe } from 'lucide-react';
import { api, compressImage } from '@/lib/api';
import { Input, TextArea, Button } from '@/components/ui/Primitives';
import { useUiStore } from '@/stores/uiStore';

const DICT = {
  ar: {
    title: 'خدمة التسوق الشخصي',
    subtitle: 'اطلب ما تحتاجه وسنقوم بشرائه وإحضاره لك',
    contact_info: 'معلومات الاتصال',
    name: 'الاسم الكريم',
    name_ph: 'مثال: أحمد محمد',
    whatsapp: 'رقم الواتساب',
    whatsapp_ph: '+965 1234 5678',
    order_details: 'تفاصيل الطلب',
    item_name: 'اسم المنتج أو الماركة',
    item_name_ph: 'مثال: iPhone 15 Pro Max 256GB',
    item_link: 'رابط المنتج (اختياري ولكن يفضل)',
    item_link_ph: 'https://...',
    details: 'تفاصيل إضافية (اللون، المقاس، الخ)',
    details_ph: 'اكتب أي تفاصيل تساعدنا في شراء المنتج الصحيح...',
    image: 'صورة المنتج (اختياري)',
    attach_image: 'إرفاق صورة',
    image_rules: 'مسموح بالصور فقط (Max 10MB)',
    remove_image: 'إزالة الصورة',
    submit: 'إرسال الطلب الآن',
    fill_error: 'يرجى ملء الاسم، الواتساب، واسم المنتج',
    generic_error: 'حدث خطأ، حاول مرة أخرى',
    success_title: 'تم استلام طلبك بنجاح!',
    success_msg: 'شكراً لطلبك. سيتم مراجعة الطلب والتواصل معك عبر الواتساب لتأكيد السعر وعمولة الشراء.',
    order_another: 'طلب منتج آخر',
    loading: 'جاري التحميل...'
  },
  en: {
    title: 'Personal Shopper Service',
    subtitle: 'Order what you need, and we will buy and bring it to you',
    contact_info: 'Contact Information',
    name: 'Full Name',
    name_ph: 'e.g., John Doe',
    whatsapp: 'WhatsApp Number',
    whatsapp_ph: '+1 234 567 8900',
    order_details: 'Order Details',
    item_name: 'Product Name or Brand',
    item_name_ph: 'e.g., iPhone 15 Pro Max 256GB',
    item_link: 'Product Link (Optional but preferred)',
    item_link_ph: 'https://...',
    details: 'Additional Details (Color, Size, etc.)',
    details_ph: 'Write any details that help us buy the correct product...',
    image: 'Product Image (Optional)',
    attach_image: 'Attach Image',
    image_rules: 'Images only (Max 10MB)',
    remove_image: 'Remove Image',
    submit: 'Submit Order Now',
    fill_error: 'Please fill in Name, WhatsApp, and Product Name',
    generic_error: 'An error occurred, please try again',
    success_title: 'Order Received Successfully!',
    success_msg: 'Thank you for your order. We will review it and contact you via WhatsApp to confirm the price and shopping commission.',
    order_another: 'Order Another Product',
    loading: 'Loading...'
  }
};

function OrderForm() {
  const params = useSearchParams();
  const trip_id = params.get('id') || '';
  
  const lang = useUiStore((s) => s.lang);
  const setLang = useUiStore((s) => s.setLang);
  const t = (key: keyof typeof DICT.ar) => DICT[lang][key] || key;
  const isRtl = lang === 'ar';

  const [form, setForm] = useState({ customer_name: '', customer_whatsapp: '', item_name: '', link: '', details: '' });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!form.customer_name || !form.customer_whatsapp || !form.item_name) {
      setError(t('fill_error'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      let base64 = '', mime = '', filename = '';
      if (file) {
        const compressed = await compressImage(file);
        base64 = compressed.base64;
        mime = compressed.mime;
        filename = file.name;
      }

      const res = await api('clientOrders.submit', {
        trip_id,
        ...form,
        base64, mime, filename
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(res.error?.message || t('generic_error'));
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground mb-3">{t('success_title')}</h1>
        <p className="text-muted-foreground max-w-sm mb-8">
          {t('success_msg')}
        </p>
        <Button onClick={() => setSuccess(false)} variant="ghost" className="rounded-full">
          {t('order_another')}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 relative" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Language Toggle */}
      <button 
        onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
        className="absolute top-4 end-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition"
      >
        <Globe size={18} />
        <span className="ms-1 text-xs font-medium uppercase">{lang === 'en' ? 'AR' : 'EN'}</span>
      </button>

      {/* Header */}
      <div className="bg-gradient-to-b from-royal-dark to-background pt-12 pb-8 px-5 rounded-b-[40px] shadow-sm mb-8 relative">
        <div className="flex items-center gap-3 mb-2 justify-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-royal-gold to-yellow-400 flex items-center justify-center shadow-lg">
            <ShoppingBag size={24} className="text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-display font-bold text-center text-foreground mt-4">{t('title')}</h1>
        <p className="text-center text-zinc-500 text-sm mt-1">{t('subtitle')}</p>
      </div>

      <div className="px-5 max-w-lg mx-auto space-y-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-2xl text-sm text-center">
            {error}
          </div>
        )}

        <div className="card-flat p-5 space-y-4">
          <h2 className="font-semibold text-lg text-foreground mb-4">{t('contact_info')}</h2>
          
          <div>
            <label className={`block text-xs font-medium text-zinc-500 mb-1.5 ${isRtl ? 'ms-1' : 'me-1'}`}>{t('name')}</label>
            <Input value={form.customer_name} onChange={v => setForm({ ...form, customer_name: String(v) })} placeholder={t('name_ph')} dir={isRtl ? 'rtl' : 'ltr'} />
          </div>
          <div>
            <label className={`block text-xs font-medium text-zinc-500 mb-1.5 ${isRtl ? 'ms-1' : 'me-1'}`}>{t('whatsapp')}</label>
            <Input value={form.customer_whatsapp} onChange={v => setForm({ ...form, customer_whatsapp: String(v) })} type="tel" placeholder={t('whatsapp_ph')} dir="ltr" className={isRtl ? 'text-end' : 'text-start'} />
          </div>
        </div>

        <div className="card-flat p-5 space-y-4">
          <h2 className="font-semibold text-lg text-foreground mb-4">{t('order_details')}</h2>
          
          <div>
            <label className={`block text-xs font-medium text-zinc-500 mb-1.5 ${isRtl ? 'ms-1' : 'me-1'}`}>{t('item_name')}</label>
            <Input value={form.item_name} onChange={v => setForm({ ...form, item_name: String(v) })} placeholder={t('item_name_ph')} dir={isRtl ? 'rtl' : 'ltr'} />
          </div>
          
          <div>
            <label className={`block text-xs font-medium text-zinc-500 mb-1.5 ${isRtl ? 'ms-1' : 'me-1'}`}>{t('item_link')}</label>
            <Input value={form.link} onChange={v => setForm({ ...form, link: String(v) })} placeholder={t('item_link_ph')} type="url" dir="ltr" className={isRtl ? 'text-end' : 'text-start'} />
          </div>

          <div>
            <label className={`block text-xs font-medium text-zinc-500 mb-1.5 ${isRtl ? 'ms-1' : 'me-1'}`}>{t('details')}</label>
            <TextArea value={form.details} onChange={v => setForm({ ...form, details: v })} placeholder={t('details_ph')} rows={3} />
          </div>

          <div>
            <label className={`block text-xs font-medium text-zinc-500 mb-1.5 ${isRtl ? 'ms-1' : 'me-1'}`}>{t('image')}</label>
            <label className="flex items-center gap-3 p-3 rounded-2xl border-2 border-dashed border-royal-border bg-black/5 dark:bg-white/5 active:bg-black/10 transition cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-royal-gold/10 flex items-center justify-center shrink-0">
                <ImagePlus size={20} className="text-royal-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{file ? file.name : t('attach_image')}</p>
                <p className="text-[11px] text-zinc-500">{t('image_rules')}</p>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
            </label>
            {file && (
              <div className="mt-2 flex justify-end">
                <button onClick={() => setFile(null)} className="text-xs text-red-400 hover:underline">{t('remove_image')}</button>
              </div>
            )}
          </div>
        </div>

        <Button onClick={submit} isLoading={loading} className="w-full !rounded-2xl py-4 !text-base shadow-xl shadow-royal-gold/20 flex items-center justify-center gap-2">
          {t('submit')} <ChevronRight size={18} className={isRtl ? 'rotate-180' : ''} />
        </Button>
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-foreground">Loading...</div>}>
      <OrderForm />
    </Suspense>
  );
}
