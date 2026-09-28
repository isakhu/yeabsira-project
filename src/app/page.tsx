import { getSession } from "@/lib/auth";
import { ROLE_DASHBOARD_ROUTES, ROLE_DISPLAY_NAMES, type Role } from "@/lib/permissions";
import Link from "next/link";

export default async function HomePage() {
  const session = await getSession();
  const isLoggedIn = session.isLoggedIn === true;
  const dashboardRoute = isLoggedIn
    ? ROLE_DASHBOARD_ROUTES[session.role as Role]
    : null;

  return (
    <>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-600">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex flex-col leading-none">
              <span className="text-xs font-bold text-brand-gold uppercase tracking-tighter">
                FDRE PPA
              </span>
              <span className="text-2xl font-extrabold tracking-tight text-white">
                FMS<span className="text-brand-gold">.</span>
              </span>
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <a
                href={dashboardRoute || "/signin"}
                className="nav-link relative text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Dashboard
              </a>
              <a
                href="#services"
                className="nav-link relative text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Services
              </a>
              <a
                href="#compliance"
                className="nav-link relative text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Compliance
              </a>
              <a
                href="#about"
                className="nav-link relative text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                About
              </a>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <Link
                  href={dashboardRoute || "/"}
                  className="hidden lg:flex items-center space-x-3 bg-slate-800 px-4 py-2 rounded-full hover:bg-slate-700 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-gold flex items-center justify-center">
                    <i className="fas fa-user text-xs text-slate-900"></i>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-white">
                      {session.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {ROLE_DISPLAY_NAMES[session.role as Role]}
                    </div>
                  </div>
                </Link>
                <Link
                  href={dashboardRoute || "/"}
                  className="bg-brand-gold hover:bg-yellow-400 text-slate-900 px-6 py-2.5 rounded-full text-sm font-bold transition-all transform hover:scale-105"
                >
                  Dashboard
                </Link>
              </div>
            ) : (
              <>
                <div className="hidden lg:flex items-center space-x-1 bg-slate-800 p-1 rounded-full">
                  <div className="w-8 h-8 rounded-full bg-brand-gold flex items-center justify-center">
                    <i className="fas fa-chevron-right text-xs text-slate-900"></i>
                  </div>
                </div>
                <Link
                  href="/signin"
                  className="bg-brand-gold hover:bg-yellow-400 text-slate-900 px-6 py-2.5 rounded-full text-sm font-bold transition-all transform hover:scale-105"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-40 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">
              Fleet Management System (FMS)
            </h1>
            <div className="max-w-xl space-y-6">
              <p className="text-xl text-gray-400 leading-relaxed">
                Automated monitoring, dispatch, and maintenance coordination for
                public transport fleets—reducing downtime and operational costs
                through real-time data.
              </p>
              <div className="flex items-center space-x-4">
                <Link
                  href="/signin"
                  className="bg-brand-gold hover:bg-yellow-400 text-slate-900 px-8 py-4 rounded-full text-lg font-bold transition-all transform hover:scale-105 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                >
                  Sign In
                </Link>
                <div className="flex items-center space-x-2 text-brand-green">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-sm font-medium">System Active</span>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
            <div className="relative rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-slate-600 aspect-video group">
              <img
                className="w-full h-full object-cover parallax-img"
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_7ce3aff2ca_5c66393023dc711f.png"
                alt="dark UI screenshot of a real-time vehicle fleet tracking dashboard with map, route lines, and telemetry"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Services Grid */}
      <section id="services" className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-4xl font-bold mb-6">Core Fleet Services</h2>
            <p className="text-gray-400 max-w-2xl text-lg">
              A unified platform covering every stage of the vehicle
              lifecycle—from booking and assignment to fuel, maintenance, and
              driver performance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Vehicle Service */}
            <div className="group relative rounded-2xl overflow-hidden border border-slate-600 shadow-[0_4px_20px_rgba(0,0,0,0.5)] bg-slate-800 aspect-[4/5]">
              <img
                className="w-full h-full object-cover parallax-img grayscale group-hover:grayscale-0 transition-all duration-500"
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_e6c04e0514_c96a8dfda9f0f56c.png"
                alt="engineer inspecting a heavy-duty truck engine in a well-lit garage, documentary photography style"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
              <div className="absolute bottom-0 p-8">
                <h3 className="text-2xl font-bold mb-4">Vehicle Service</h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                  Comprehensive service plans, scheduled inspections, and
                  digital service records for every asset in the fleet.
                </p>
                <a
                  href="#"
                  className="inline-flex items-center text-brand-gold font-semibold hover:translate-x-1 transition-transform"
                >
                  Learn More{" "}
                  <i className="fas fa-arrow-right ml-2 text-xs"></i>
                </a>
              </div>
            </div>

            {/* Vehicle Maintenance */}
            <div className="group relative rounded-2xl overflow-hidden border border-slate-600 shadow-[0_4px_20px_rgba(0,0,0,0.5)] bg-slate-800 aspect-[4/5]">
              <img
                className="w-full h-full object-cover parallax-img grayscale group-hover:grayscale-0 transition-all duration-500"
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_3be850c994_3c483dc8d030c0b6.png"
                alt="mechanic working on vehicle brake system with diagnostic tools, industrial workshop setting, moody lighting"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
              <div className="absolute bottom-0 p-8">
                <h3 className="text-2xl font-bold mb-4">
                  Vehicle Maintenance
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                  Predictive diagnostics, parts inventory, and automated work
                  orders to keep vehicles roadworthy year-round.
                </p>
                <a
                  href="#"
                  className="inline-flex items-center text-brand-gold font-semibold hover:translate-x-1 transition-transform"
                >
                  Learn More{" "}
                  <i className="fas fa-arrow-right ml-2 text-xs"></i>
                </a>
              </div>
            </div>

            {/* Fuel Management */}
            <div className="group relative rounded-2xl overflow-hidden border border-slate-600 shadow-[0_4px_20px_rgba(0,0,0,0.5)] bg-slate-800 aspect-[4/5]">
              <img
                className="w-full h-full object-cover parallax-img grayscale group-hover:grayscale-0 transition-all duration-500"
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_c18ebfc902_59825cba760da87f.png"
                alt="close-up of fuel nozzle refilling a tanker truck at night with glowing gauges, cinematic blue tones"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
              <div className="absolute bottom-0 p-8">
                <h3 className="text-2xl font-bold mb-4">Fuel Management</h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                  Real-time consumption monitoring, route-based efficiency
                  scoring, and cost optimization across the entire fleet.
                </p>
                <a
                  href="#"
                  className="inline-flex items-center text-brand-gold font-semibold hover:translate-x-1 transition-transform"
                >
                  Learn More{" "}
                  <i className="fas fa-arrow-right ml-2 text-xs"></i>
                </a>
              </div>
            </div>

            {/* Driver Behavior */}
            <div className="group relative rounded-2xl overflow-hidden border border-slate-600 shadow-[0_4px_20px_rgba(0,0,0,0.5)] bg-slate-800 aspect-[4/5]">
              <img
                className="w-full h-full object-cover parallax-img grayscale group-hover:grayscale-0 transition-all duration-500"
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_10040af61c_e9f7fd84148f5937.png"
                alt="truck driver hands on steering wheel viewed from passenger seat on highway at dusk, atmospheric photography"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
              <div className="absolute bottom-0 p-8">
                <h3 className="text-2xl font-bold mb-4">Driver Behavior</h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                  Telematics-driven reporting on acceleration, braking, and high
                  RPM events to promote safer driving habits.
                </p>
                <a
                  href="#"
                  className="inline-flex items-center text-brand-gold font-semibold hover:translate-x-1 transition-transform"
                >
                  Learn More{" "}
                  <i className="fas fa-arrow-right ml-2 text-xs"></i>
                </a>
              </div>
            </div>

            {/* Online Booking */}
            <div className="group relative rounded-2xl overflow-hidden border border-slate-600 shadow-[0_4px_20px_rgba(0,0,0,0.5)] bg-slate-800 aspect-[4/5]">
              <img
                className="w-full h-full object-cover parallax-img grayscale group-hover:grayscale-0 transition-all duration-500"
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_e33fa56035_4fa4bc9719e7b92b.png"
                alt="tablet showing a clean transport booking form interface held by a person in an office, soft natural lighting"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
              <div className="absolute bottom-0 p-8">
                <h3 className="text-2xl font-bold mb-4">Online Booking</h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                  Self-service request forms, availability checks, and instant
                  confirmation for scheduled transport needs.
                </p>
                <a
                  href="#"
                  className="inline-flex items-center text-brand-gold font-semibold hover:translate-x-1 transition-transform"
                >
                  Learn More{" "}
                  <i className="fas fa-arrow-right ml-2 text-xs"></i>
                </a>
              </div>
            </div>

            {/* Driver Assignment */}
            <div className="group relative rounded-2xl overflow-hidden border border-slate-600 shadow-[0_4px_20px_rgba(0,0,0,0.5)] bg-slate-800 aspect-[4/5]">
              <img
                className="w-full h-full object-cover parallax-img grayscale group-hover:grayscale-0 transition-all duration-500"
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_e6479b65a8_03de86543eacdead.png"
                alt="fleet dispatcher reviewing driver roster on a large monitor in a control room, professional corporate atmosphere"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
              <div className="absolute bottom-0 p-8">
                <h3 className="text-2xl font-bold mb-4">Driver Assignment</h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                  Smart matching of drivers to routes and vehicles based on
                  certification, availability, and shift status.
                </p>
                <a
                  href="#"
                  className="inline-flex items-center text-brand-gold font-semibold hover:translate-x-1 transition-transform"
                >
                  Learn More{" "}
                  <i className="fas fa-arrow-right ml-2 text-xs"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About / Mission Section */}
      <section id="about" className="py-24 border-t border-slate-600">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-12 mb-24">
            <div className="lg:col-span-3">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                GOVERNANCE
              </span>
            </div>
            <div className="lg:col-span-9">
              <h2 className="text-4xl lg:text-5xl font-bold mb-8 leading-tight">
                A transparent, data-driven framework for managing public
                transport assets across every region.
              </h2>
              <p className="text-xl text-gray-400 mb-12 max-w-3xl">
                The FMS aligns procurement, maintenance, and dispatch under one
                accountable ledger—ensuring regulatory compliance, extending
                asset longevity, and improving logistical efficiency for all
                stakeholders.
              </p>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="border-t border-slate-600 pt-6">
                  <h4 className="font-bold mb-2">Institutional Mandates</h4>
                  <p className="text-sm text-gray-400">
                    Operational directives and policy standards governing fleet
                    allocation and usage.
                  </p>
                </div>
                <div className="border-t border-slate-600 pt-6">
                  <h4 className="font-bold mb-2">Integration Frameworks</h4>
                  <p className="text-sm text-gray-400">
                    Seamless connectivity with regional logistics systems and
                    procurement platforms.
                  </p>
                </div>
                <div className="border-t border-slate-600 pt-6">
                  <h4 className="font-bold mb-2">Resource Audits</h4>
                  <p className="text-sm text-gray-400">
                    Continuous evaluation of fleet utilization, fuel spend, and
                    maintenance outcomes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pull Quote */}
          <div className="grid lg:grid-cols-2 gap-12 items-center border-t border-slate-600 py-20">
            <div>
              <p className="text-3xl lg:text-4xl font-medium leading-snug">
                &ldquo;Standardizing public transport operations through direct
                telematics and data-driven accountability&rdquo;
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-slate-600 aspect-video">
              <img
                className="w-full h-full object-cover"
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_7b00f15054_4cdd508e25954ae4.png"
                alt="modern transport dispatch control center with operators at desks and large fleet map screens, cool blue lighting"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section
        id="compliance"
        className="py-24 bg-slate-800 border-t border-slate-600"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-start mb-20">
            <div>
              <span className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 block">
                COMPLIANCE
              </span>
              <h2 className="text-5xl font-bold mb-8">
                Regulatory &amp; Operational Standards
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Every vehicle and driver is measured against nationally
                recognized safety, environmental, and procurement benchmarks
                enforced through automated audit trails.
              </p>
              <a
                href="#"
                className="inline-flex items-center text-brand-gold font-semibold hover:translate-x-1 transition-transform"
              >
                View Full Standards{" "}
                <i className="fas fa-arrow-right ml-2 text-xs"></i>
              </a>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-slate-600 aspect-video">
              <img
                className="w-full h-full object-cover"
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_f359837554_b8f51d332da0f9dc.png"
                alt="document compliance checklist being reviewed beside a tablet showing audit graphs, professional office environment"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-8 border border-slate-600 rounded-2xl hover:border-brand-gold transition-colors bg-slate-700">
              <i className="fas fa-shield-halved text-3xl text-brand-gold mb-6"></i>
              <h3 className="text-xl font-bold mb-4">Safety Audits</h3>
              <p className="text-gray-400 text-sm">
                Mandatory periodic inspections with digital certification and
                expiry tracking.
              </p>
            </div>
            <div className="p-8 border border-slate-600 rounded-2xl hover:border-brand-gold transition-colors bg-slate-700">
              <i className="fas fa-leaf text-3xl text-brand-gold mb-6"></i>
              <h3 className="text-xl font-bold mb-4">Emissions Control</h3>
              <p className="text-gray-400 text-sm">
                Continuous emissions monitoring aligned with national
                environmental directives.
              </p>
            </div>
            <div className="p-8 border border-slate-600 rounded-2xl hover:border-brand-gold transition-colors bg-slate-700">
              <i className="fas fa-file-contract text-3xl text-brand-gold mb-6"></i>
              <h3 className="text-xl font-bold mb-4">Procurement Rules</h3>
              <p className="text-gray-400 text-sm">
                Transparent tendering and asset acquisition following public
                procurement law.
              </p>
            </div>
            <div className="p-8 border border-slate-600 rounded-2xl hover:border-brand-gold transition-colors bg-slate-700">
              <i className="fas fa-chart-line text-3xl text-brand-gold mb-6"></i>
              <h3 className="text-xl font-bold mb-4">
                Performance Reporting
              </h3>
              <p className="text-gray-400 text-sm">
                Quarterly fleet KPIs published for stakeholder review and
                accountability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-600 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20">
            <div className="col-span-2 lg:col-span-2">
              <a
                href="#"
                className="text-3xl font-extrabold tracking-tight text-white mb-6 inline-block"
              >
                FMS<span className="text-brand-gold">.</span>
              </a>
              <p className="text-gray-400 max-w-sm">
                Intelligent mobility for public utility. Managing the fleet that
                keeps the nation moving.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-sm uppercase tracking-wider text-gray-500">
                Resources
              </h4>
              <ul className="space-y-4 text-gray-300">
                <li>
                  <a
                    href="#"
                    className="hover:text-brand-gold transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-brand-gold transition-colors"
                  >
                    API Reference
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-brand-gold transition-colors"
                  >
                    System Status
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-brand-gold transition-colors"
                  >
                    Changelog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-sm uppercase tracking-wider text-gray-500">
                System
              </h4>
              <ul className="space-y-4 text-gray-300">
                <li>
                  <a
                    href="#"
                    className="hover:text-brand-gold transition-colors"
                  >
                    Dashboard
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-brand-gold transition-colors"
                  >
                    Booking
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-brand-gold transition-colors"
                  >
                    Maintenance
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-brand-gold transition-colors"
                  >
                    Analytics
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-sm uppercase tracking-wider text-gray-500">
                Governance
              </h4>
              <ul className="space-y-4 text-gray-300">
                <li>
                  <a
                    href="#"
                    className="hover:text-brand-gold transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-brand-gold transition-colors"
                  >
                    Compliance
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-brand-gold transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-brand-gold transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-10 border-t border-slate-600 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-gray-500 text-sm">
              © 2024 Powered by Bahir Dar University
            </p>
            <div className="flex space-x-6">
              <a
                href="#"
                className="text-gray-500 hover:text-white transition-colors"
              >
                <i className="fab fa-twitter"></i>
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-white transition-colors"
              >
                <i className="fab fa-linkedin"></i>
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-white transition-colors"
              >
                <i className="fab fa-github"></i>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
