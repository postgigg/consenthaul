import { ReactNode } from 'react';

interface IPhoneFrameProps {
  children: ReactNode;
  screenBg?: string;
  statusBarVariant?: 'light' | 'dark';
}

export function IPhoneFrame({
  children,
  screenBg = 'white',
  statusBarVariant = 'light',
}: IPhoneFrameProps) {
  const isDark = statusBarVariant === 'dark';
  const barFill = isDark ? '#e2e4e9' : '#0c0f14';
  const barBatteryFill = isDark ? '#28c840' : '#28c840';

  return (
    <div className="relative w-[280px] sm:w-[310px] lg:w-[340px]">
      <div
        className="rounded-[36px] sm:rounded-[42px] lg:rounded-[48px] p-[3px] sm:p-[3.5px]"
        style={{
          background:
            'linear-gradient(145deg, #5a5a5e 0%, #4a4a4e 15%, #3a3a3c 30%, #2a2a2c 50%, #3a3a3c 70%, #4a4a4e 85%, #5a5a5e 100%)',
          boxShadow:
            '0 50px 100px -25px rgba(0,0,0,0.5), 0 25px 50px -15px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.3)',
        }}
      >
        <div
          className="rounded-[34px] sm:rounded-[40px] lg:rounded-[46px] p-[1px]"
          style={{
            background:
              'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.15) 50%, rgba(255,255,255,0.05) 100%)',
          }}
        >
          {/* Side buttons */}
          <div
            className="absolute -left-[2px] top-[80px] w-[3px] h-[14px] rounded-l-sm"
            style={{
              background:
                'linear-gradient(180deg, #555 0%, #3a3a3c 50%, #555 100%)',
            }}
          />
          <div
            className="absolute -left-[2px] top-[112px] w-[3px] h-[30px] rounded-l-sm"
            style={{
              background:
                'linear-gradient(180deg, #555 0%, #3a3a3c 50%, #555 100%)',
            }}
          />
          <div
            className="absolute -left-[2px] top-[150px] w-[3px] h-[30px] rounded-l-sm"
            style={{
              background:
                'linear-gradient(180deg, #555 0%, #3a3a3c 50%, #555 100%)',
            }}
          />
          <div
            className="absolute -right-[2px] top-[122px] w-[3px] h-[42px] rounded-r-sm"
            style={{
              background:
                'linear-gradient(180deg, #555 0%, #3a3a3c 50%, #555 100%)',
            }}
          />
          <div
            className="absolute -right-[2px] bottom-[30%] w-[3px] h-[16px] rounded-r-sm"
            style={{
              background:
                'linear-gradient(180deg, #555 0%, #3a3a3c 50%, #555 100%)',
            }}
          />

          <div className="bg-[#000] rounded-[33px] sm:rounded-[39px] lg:rounded-[45px] overflow-hidden">
            {/* Notch */}
            <div className="bg-black flex justify-center pt-[8px] sm:pt-[10px] lg:pt-[12px] pb-[3px] sm:pb-[4px]">
              <div
                className="w-[64px] sm:w-[76px] lg:w-[82px] h-[14px] sm:h-[17px] lg:h-[19px] bg-[#000] rounded-full flex items-center justify-center gap-[6px] sm:gap-[8px]"
                style={{
                  boxShadow: 'inset 0 0 0 0.5px rgba(50,50,54,0.6)',
                }}
              >
                <div
                  className="w-[4px] h-[4px] sm:w-[5px] sm:h-[5px] rounded-full bg-[#0c0c0e]"
                  style={{
                    boxShadow: 'inset 0 0 0 0.5px rgba(60,60,65,0.5)',
                  }}
                />
                <div className="w-[3px] h-[3px] sm:w-[4px] sm:h-[4px] rounded-full bg-[#0e0e10]" />
              </div>
            </div>

            {/* Screen */}
            <div
              className="relative flex flex-col"
              style={{
                background: screenBg,
                aspectRatio: '393 / 852',
              }}
            >
              {/* Subtle glass overlay */}
              <div
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  background:
                    'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.03) 100%)',
                }}
              />

              {/* Status bar */}
              <div className="shrink-0 relative z-[5]">
                <svg
                  viewBox="0 0 393 24"
                  fill="none"
                  className="w-full block"
                >
                  <rect width="393" height="24" fill={screenBg} />
                  <text
                    x="197"
                    y="17"
                    textAnchor="middle"
                    fill={barFill}
                    fontSize="11"
                    fontWeight="700"
                    fontFamily="system-ui"
                  >
                    9:41
                  </text>
                  {/* Signal bars */}
                  <rect x="26" y="8" width="3.5" height="6" rx="0.7" fill={barFill} opacity="0.8" />
                  <rect x="31.5" y="6.5" width="3.5" height="7.5" rx="0.7" fill={barFill} opacity="0.8" />
                  <rect x="37" y="5" width="3.5" height="9" rx="0.7" fill={barFill} opacity="0.8" />
                  <rect x="42.5" y="3" width="3.5" height="11" rx="0.7" fill={barFill} opacity="0.25" />
                  {/* WiFi */}
                  <path d="M58 10 C61.5 5.5, 68.5 5.5, 72 10" stroke={barFill} strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.7" />
                  <path d="M61.5 13 C63 10.5, 67 10.5, 68.5 13" stroke={barFill} strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.7" />
                  <circle cx="65" cy="15.5" r="1.2" fill={barFill} opacity="0.7" />
                  {/* Battery */}
                  <rect x="335" y="5" width="26" height="13" rx="3.5" fill="none" stroke={barFill} strokeWidth="1.2" opacity="0.6" />
                  <rect x="361" y="8.5" width="1.8" height="6" rx="0.9" fill={barFill} opacity="0.4" />
                  <rect x="337.5" y="7.5" width="19" height="8" rx="2" fill={barBatteryFill} opacity="0.75" />
                </svg>
              </div>

              {/* Children content */}
              <div className="flex-1 min-h-0 overflow-y-auto relative z-[1]" style={{ scrollbarWidth: 'none' }}>
                {children}
              </div>

              {/* Home indicator */}
              <div className="shrink-0 flex justify-center py-[6px] sm:py-[8px] relative z-[5]" style={{ background: screenBg }}>
                <div
                  className="w-[80px] sm:w-[90px] lg:w-[100px] h-[4px] sm:h-[5px] rounded-full"
                  style={{
                    background: isDark
                      ? 'rgba(255,255,255,0.15)'
                      : 'rgba(12,15,20,0.15)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
