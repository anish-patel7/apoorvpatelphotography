import { Link } from 'react-router-dom';

const items = [
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDt27L6h0Jzwi0ayyTEEh2fvGtB7pZQiAsO9S8RWWIjMHsNjG5mXtMTgN0uiDvX9B3EMopsjuimJAbHciY4DWbwC75Jg3tnt5bDJMu6BPqukqVGAS5S7uWG52m3mT1OylnVMrGuHg0W0DlrG7E4lOqdZ1gOazkgr9jL14HtWPWUjtBQ38OOGUbjmGF9vp_JF4Jr1sj9yy75lSPb7BrJQQKnVXM9ue6UNFnojh2cQaz345ULhmNkMXR7',
    label: 'Editorial',
    span: 'md:col-span-2 md:row-span-2',
  },
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDP2iZvbwRC-zRNkfDSZPHpHw3tSR84KMK-DsV6xwePQqv2lll_v-kz4WVnx8lpLF6Lq2aVxnpb3qkoNjpoeV4VtQXytQpev4WPU19kp-XOUmil7-_LWlhVYpX8FZPp6b0L2f_H1_L7YEmAP_jkxdvc4ESqMxTv0vktwa26kHPsCaFrMHHRoziFuQUFt2EJzAvsXirdQ5QJOtaFSlRPnBf_sqx1vrx3s7rsL89LC36y4Rz0QAfaXJDs',
    label: 'Landscapes',
    span: 'md:col-span-2 md:row-span-1',
  },
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBERUsMhsu-Vaw5tcLfcx5_vISPgvn7WNhK62sfms1u6GDsyC-994LIbnIl2kKxcFt4UIJ50wNB9-qEPcOjOatjDlLzbu1PHw4NplErcWXb5Pv4Qf7B8aYVDhduPIy7avBg13uFO0H4yQznrZ4p-gQtFwHjGcIR-0cDuG46LVvrx3ZY440H2Xa_r1hsi-TAf7YIyzZcSb-9G7H4SMxjTkQ14jhzbjGVCXiaBu0VOm8jWX2TPaqxmLM_',
    label: 'Product',
    span: 'md:col-span-1 md:row-span-1',
  },
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4IEROsjkn2FRNHFgzK2v5tnEV-pk2SofVUZOK5YejlZuU-hhT4jsKHmjVZ65k7C0G4GWwTMWzhCOXR4PMcKqSpz_x-61tEC8sQl0yvClKvkki9Ng1JwFb8fQV72bnpIwvv6FM_6pDoeICHuxhXgX2uQKs9SgTnx_CwzTSk90LgMBAo6m5Ofx3JkAlR4eO69NwMj4CecRHuewUSAT9eEr5_WV60iTc6YVkSfo9IaDovc7NhQTXUsA-',
    label: 'Motion',
    span: 'md:col-span-1 md:row-span-1',
  },
];

export default function FeaturedPortfolio() {
  return (
    <section className="fade-in">
      <div className="flex justify-between items-end mb-16">
        <div>
          <h2 className="font-display text-[32px] md:text-[48px] text-on-background mb-4 leading-tight">
            Selected Works
          </h2>
          <div className="w-16 h-[2px] bg-tertiary" />
        </div>
        <Link
          to="/portfolio"
          className="font-body text-[12px] font-bold tracking-[0.15em] uppercase text-tertiary hover:text-white transition-colors flex items-center gap-2"
        >
          View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[800px]">
        {items.map(item => (
          <div
            key={item.label}
            className={`gallery-card rounded-lg ${item.span} min-h-[250px] md:min-h-0`}
          >
            <img
              src={item.image}
              alt={item.label}
              className="w-full h-full object-cover"
            />
            <div className="gallery-overlay flex items-center justify-center">
              <span className="font-display text-[32px] text-white">{item.label}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
