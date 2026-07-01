export function SectionTabs({ tabs, active, onChange }) {
  return (
    <div className='flex gap-1 bg-slate-100 p-1 rounded-xl w-fit'>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            active === tab.id
              ? 'bg-white text-slate-800 shadow-sm font-semibold'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {tab.icon && <span className='mr-1.5'>{tab.icon}</span>}
          {tab.label}
          {tab.count !== undefined && (
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
              active === tab.id ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-500'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
