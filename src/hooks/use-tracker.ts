
"use client";

import { useMemoFirebase, useCollection, useDoc, useFirestore, useUser } from '@/firebase';
import { collection, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { DeliveryEntry, UserSettings } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

export function useTracker() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  // Settings
  const settingsRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid, 'userProfile', 'settings');
  }, [db, user]);

  const { data: rawSettings, isLoading: isSettingsLoading } = useDoc<any>(settingsRef);

  const settings: UserSettings = rawSettings ? {
    petrolPrice: rawSettings.petrolPrice ?? 105.4,
    mileage: rawSettings.mileage ?? 40,
    dailyGoal: rawSettings.dailyGoal ?? 1000,
    autoFuelCalc: rawSettings.autoFuelCalc ?? true,
  } : {
    petrolPrice: 105.4,
    mileage: 40,
    dailyGoal: 1000,
    autoFuelCalc: true,
  };

  // Entries
  const entriesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'deliveryLogs'),
      orderBy('date', 'desc')
    );
  }, [db, user]);

  const { data: entries = [], isLoading: isEntriesLoading } = useCollection<DeliveryEntry>(entriesQuery);

  const saveSettings = (newSettings: UserSettings) => {
    if (!settingsRef) return;
    setDocumentNonBlocking(settingsRef, {
      ...newSettings,
      id: user?.uid,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    toast({ title: "Settings Updated", description: "Your profile has been updated." });
  };

  const addEntry = (entry: Omit<DeliveryEntry, 'id' | 'fuelCost' | 'netProfit'>) => {
    if (!db || !user) return;
    const colRef = collection(db, 'users', user.uid, 'deliveryLogs');

    const fuelUsed = entry.distance / settings.mileage;
    const fuelCost = settings.autoFuelCalc ? fuelUsed * settings.petrolPrice : 0;
    const netProfit = entry.earnings + entry.tips + (entry.incentive || 0) - (fuelCost + entry.manualExpenses);

    const data = {
      ...entry,
      userId: user.uid,
      fuelCost: Number(fuelCost.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    addDocumentNonBlocking(colRef, data);
    toast({ title: "Entry Added", description: `Added earnings for ${entry.date}` });
  };

  const updateEntry = (id: string, entry: Partial<Omit<DeliveryEntry, 'id'>>) => {
    if (!db || !user) return;
    const docRef = doc(db, 'users', user.uid, 'deliveryLogs', id);

    // Recalculate if financial fields are updated
    let fuelCost = entry.fuelCost;
    let netProfit = entry.netProfit;

    if (
      entry.distance !== undefined || 
      entry.earnings !== undefined || 
      entry.tips !== undefined || 
      entry.incentive !== undefined ||
      entry.manualExpenses !== undefined
    ) {
      const existing = entries.find(e => e.id === id);
      const distance = entry.distance ?? existing?.distance ?? 0;
      const earnings = entry.earnings ?? existing?.earnings ?? 0;
      const tips = entry.tips ?? existing?.tips ?? 0;
      const incentive = entry.incentive ?? existing?.incentive ?? 0;
      const manualExpenses = entry.manualExpenses ?? existing?.manualExpenses ?? 0;

      const fuelUsed = distance / settings.mileage;
      fuelCost = settings.autoFuelCalc ? fuelUsed * settings.petrolPrice : (entry.fuelCost ?? existing?.fuelCost ?? 0);
      netProfit = earnings + tips + incentive - (fuelCost + manualExpenses);
      
      entry.fuelCost = Number(fuelCost.toFixed(2));
      entry.netProfit = Number(netProfit.toFixed(2));
    }

    updateDocumentNonBlocking(docRef, {
      ...entry,
      updatedAt: serverTimestamp(),
    });
    toast({ title: "Entry Updated", description: "Changes synchronized to cloud." });
  };

  const deleteEntry = (id: string) => {
    if (!db || !user) return;
    const docRef = doc(db, 'users', user.uid, 'deliveryLogs', id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Entry Deleted" });
  };

  return {
    entries: entries || [],
    settings,
    saveSettings,
    addEntry,
    updateEntry,
    deleteEntry,
    loading: isUserLoading || isSettingsLoading || isEntriesLoading
  };
}
