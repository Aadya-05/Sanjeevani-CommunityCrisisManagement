import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="max-w-4xl card border-red-500/20">
        <span className="text-7xl mb-5 block">🏥</span>
        <p className="inline-flex items-center rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-xs text-red-200 mb-4">
          Real-Time Emergency Coordination
        </p>
        <h1 className="text-5xl sm:text-6xl font-black text-white mb-4 tracking-tight">Sanjeevani</h1>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
          Connect civilians, police, hospitals, volunteers, and blood donors on one live crisis platform with map updates, SOS broadcasts, and incident chat.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link to="/register" className="btn-primary px-8 py-3 text-lg">Get Started</Link>
          <Link to="/login" className="btn-secondary px-8 py-3 text-lg">Sign In</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10 max-w-6xl w-full">
        {[
          ['🚨', 'Real-time Alerts', 'Geo-fenced push notifications under 2 seconds'],
          ['🗺️', 'Live Crisis Map', 'Multi-incident tracking with severity clustering'],
          ['🩸', 'Blood Donors', 'Proximity-based donor registry for emergencies'],
          ['👮', 'Multi-role Access', 'Civilian, Police, Hospital, NGO, and more'],
        ].map(([icon, title, desc]) => (
          <div key={title} className="card text-center hover:-translate-y-0.5 transition-transform">
            <span className="text-3xl">{icon}</span>
            <p className="font-semibold text-white mt-2 text-sm">{title}</p>
            <p className="text-xs text-slate-400 mt-1">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}