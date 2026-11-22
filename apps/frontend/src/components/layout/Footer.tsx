import React from 'react';
import Link from 'next/link';
import { ShieldCheck, PhoneCall, Scale, AlertCircle, FileText } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-100 dark:bg-[#0c0907] text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-white/10 text-xs transition-colors duration-200">
      {/* Statutory Regulatory Banner */}
      <div className="bg-slate-200/80 dark:bg-[#070503] border-b border-slate-300/80 dark:border-white/10 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-saffron-500 shrink-0 mt-0.5" />
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            <strong className="text-slate-900 dark:text-white">Statutory Regulatory Notice (Bar Council of India Rule 36):</strong> Under the
            Advocates Act 1961 and BCI Rules, advocates are legally prohibited from advertising, touting, or soliciting work.
            NyayaSetu operates strictly as a neutral technological directory and communications infrastructure. Listings are
            factual (qualifications, year enrolled, courts admitted, statutory fees) and do not constitute recommendations,
            rankings, or endorsements. The platform does not take commissions from legal consultation fees.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand & Mandate */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-saffron-600 flex items-center justify-center text-white font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <span className="text-base font-bold text-slate-900 dark:text-white tracking-wide">NyayaSetu India</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            National digital justice facilitation bridge connecting citizens with verified advocates, notaries, mediators,
            and legal aid clinics across all 28 states and 8 union territories.
          </p>
          <div className="flex items-center space-x-2 text-govgreen-700 dark:text-govgreen-600 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>DPDP Act 2023 Sovereign Data Storage (Mumbai)</span>
          </div>
        </div>

        {/* Legal & Regulatory Framework */}
        <div className="space-y-2">
          <h4 className="text-slate-900 dark:text-white font-semibold uppercase tracking-wider text-xs">Statutory Frameworks</h4>
          <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
            <li>Advocates Act, 1961 (Section 35 &amp; Rule 36)</li>
            <li>Notaries Act, 1952 (Official Gazette Rates)</li>
            <li>Mediation Act, 2023 (Sec 20 Empanelment)</li>
            <li>Arbitration &amp; Conciliation Act, 1996</li>
            <li>Legal Services Authorities Act, 1987 (NALSA)</li>
            <li>Digital Personal Data Protection Act, 2023</li>
          </ul>
        </div>

        {/* Citizen Services */}
        <div className="space-y-2">
          <h4 className="text-slate-900 dark:text-white font-semibold uppercase tracking-wider text-xs">Citizen Services</h4>
          <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
            <li>
              <Link href="/providers" className="hover:text-saffron-600 dark:hover:text-saffron-500 transition-colors">
                Find Bar Council Verified Advocate
              </Link>
            </li>
            <li>
              <Link href="/providers?providerType=NOTARY" className="hover:text-saffron-600 dark:hover:text-saffron-500 transition-colors">
                Find Gazette Commissioned Notary
              </Link>
            </li>
            <li>
              <Link href="/providers?providerType=MEDIATOR" className="hover:text-saffron-600 dark:hover:text-saffron-500 transition-colors">
                Accredited Commercial Mediator
              </Link>
            </li>
            <li>
              <Link href="/onboarding" className="hover:text-saffron-600 dark:hover:text-saffron-500 transition-colors">
                Legal Service Provider Onboarding Wizard
              </Link>
            </li>
          </ul>
        </div>

        {/* Emergency Helplines & Redressal */}
        <div className="space-y-2">
          <h4 className="text-slate-900 dark:text-white font-semibold uppercase tracking-wider text-xs">Support &amp; Grievances</h4>
          <div className="bg-slate-200/80 dark:bg-[#140f0b] p-3 rounded-lg border border-slate-300 dark:border-white/10 space-y-1.5">
            <div className="flex items-center space-x-2 text-saffron-600 dark:text-saffron-500 font-bold">
              <PhoneCall className="w-4 h-4" />
              <span>NALSA Legal Aid: 15100 (Toll-Free)</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-[11px]">
              National Legal Services Authority (NALSA) 24x7 helpline for free legal representation to eligible citizens.
            </p>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400">
            <span>Data Protection Grievance Officer:</span>
            <br />
            <span className="text-slate-900 dark:text-slate-200">grievance-officer@nyayasetu.gov.in</span>
          </div>
        </div>
      </div>

      {/* Bottom Copyright & Disclaimer */}
      <div className="border-t border-slate-300 dark:border-white/10 py-4 px-4 sm:px-6 lg:px-8 text-center text-slate-500 dark:text-slate-400 text-[11px]">
        <p>© 2026 NyayaSetu India (न्यायसेतु) • Ministry of Law &amp; Justice • Bar Council of India Rule 36 &amp; DPDP Act 2023 Compliant.</p>
      </div>
    </footer>
  );
};

