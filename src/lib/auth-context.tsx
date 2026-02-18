import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Company, Membership } from './types';

interface MembershipWithCompany {
  membership: Membership;
  company: Company;
}

interface AuthContextType {
  user: User | null;
  company: Company | null;
  membership: Membership | null;
  allMemberships: MembershipWithCompany[];
  loading: boolean;
  signOut: () => Promise<void>;
  updateCompanyName: (name: string) => void;
  switchCompany: (companyId: string) => void;
}

const SELECTED_COMPANY_KEY = 'selected_company_id';

const AuthContext = createContext<AuthContextType>({
  user: null,
  company: null,
  membership: null,
  allMemberships: [],
  loading: true,
  signOut: async () => {},
  updateCompanyName: () => {},
  switchCompany: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [allMemberships, setAllMemberships] = useState<MembershipWithCompany[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async (userId: string, retryCount = 0): Promise<void> => {
    try {
      setLoading(true);

      // For retries (new signup, DB trigger may not have completed yet)
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Step 1: Get ALL memberships for this user
      const { data: membershipsData, error: membershipError } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (membershipError) {
        console.error(`Error loading memberships (attempt ${retryCount + 1}):`, membershipError.message);

        if (retryCount < 5) {
          console.log(`Memberships error, retrying (${retryCount + 1}/5)...`);
          return loadUserData(userId, retryCount + 1);
        }

        setCompany(null);
        setMembership(null);
        setAllMemberships([]);
        setLoading(false);
        return;
      }

      if (!membershipsData || membershipsData.length === 0) {
        // No memberships found - retry for new signups
        if (retryCount < 5) {
          console.log(`No memberships found, retrying (${retryCount + 1}/5)...`);
          return loadUserData(userId, retryCount + 1);
        }

        setCompany(null);
        setMembership(null);
        setAllMemberships([]);
        setLoading(false);
        return;
      }

      // Step 2: Get all companies for these memberships
      const companyIds = [...new Set(membershipsData.map(m => m.company_id))];
      const { data: companiesData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .in('id', companyIds);

      if (companyError) {
        console.error('Error loading companies:', companyError.message);
        setCompany(null);
        setMembership(null);
        setAllMemberships([]);
        setLoading(false);
        return;
      }

      // Step 3: Build all memberships with company data
      const companyMap = new Map(companiesData?.map(c => [c.id, c]) || []);
      const allMembershipsWithCompany: MembershipWithCompany[] = membershipsData
        .map(m => {
          const c = companyMap.get(m.company_id);
          if (!c) return null;
          return {
            membership: {
              companyId: m.company_id,
              userId: m.user_id,
              role: m.role,
              createdAt: new Date(m.created_at),
            },
            company: {
              id: c.id,
              name: c.name,
              plan: c.plan,
              createdAt: new Date(c.created_at),
            },
          };
        })
        .filter(Boolean) as MembershipWithCompany[];

      setAllMemberships(allMembershipsWithCompany);

      // Step 4: Pick the active company
      // Check localStorage for a previously selected company
      const savedCompanyId = localStorage.getItem(SELECTED_COMPANY_KEY);
      let active = allMembershipsWithCompany.find(m => m.company.id === savedCompanyId);

      // If not found, use the first one
      if (!active) {
        active = allMembershipsWithCompany[0];
      }

      if (active) {
        setCompany(active.company);
        setMembership(active.membership);
        localStorage.setItem(SELECTED_COMPANY_KEY, active.company.id);
      } else {
        setCompany(null);
        setMembership(null);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      setCompany(null);
      setMembership(null);
      setAllMemberships([]);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadUserData(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);

      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        loadUserData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCompany(null);
        setMembership(null);
        setAllMemberships([]);
        setLoading(false);
      } else if (event === 'USER_UPDATED' && session?.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCompany(null);
    setMembership(null);
    setAllMemberships([]);
    localStorage.removeItem(SELECTED_COMPANY_KEY);
  }, []);

  const updateCompanyName = useCallback((name: string) => {
    setCompany(prev => prev ? { ...prev, name } : prev);
  }, []);

  const switchCompany = useCallback((companyId: string) => {
    const target = allMemberships.find(m => m.company.id === companyId);
    if (target) {
      setCompany(target.company);
      setMembership(target.membership);
      localStorage.setItem(SELECTED_COMPANY_KEY, companyId);
    }
  }, [allMemberships]);

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        membership,
        allMemberships,
        loading,
        signOut,
        updateCompanyName,
        switchCompany,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
