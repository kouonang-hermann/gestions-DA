import * as XLSX from 'xlsx';

export interface ExcelItem {
  nom: string;
  reference: string;
  unite: string;
  quantite: number;
  description: string;
}

/**
 * Génère et télécharge un fichier Excel template vierge pour les demandes
 */
export function downloadExcelTemplate() {
  // Créer les données du template avec les en-têtes
  const templateData = [
    ['Nom de l\'article', 'Référence', 'Unité', 'Quantité', 'Description'],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
  ];

  // Créer un nouveau workbook
  const wb = XLSX.utils.book_new();
  
  // Créer une feuille à partir des données
  const ws = XLSX.utils.aoa_to_sheet(templateData);

  // Définir la largeur des colonnes
  ws['!cols'] = [
    { wch: 30 }, // Nom de l'article
    { wch: 20 }, // Référence
    { wch: 15 }, // Unité
    { wch: 15 }, // Quantité
    { wch: 40 }, // Description
  ];

  // Ajouter la feuille au workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Demande');

  // Générer le fichier et le télécharger
  XLSX.writeFile(wb, 'template_demande.xlsx');
}

/**
 * Parse un fichier Excel uploadé et retourne les items
 * @param file - Le fichier Excel uploadé
 * @returns Promise avec la liste des items parsés
 */
export async function parseExcelFile(file: File): Promise<ExcelItem[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // Prendre la première feuille
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convertir en JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        // Parser les données (ignorer la première ligne qui contient les en-têtes)
        const items: ExcelItem[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          
          // Ignorer les lignes vides
          if (!row || row.length === 0 || !row[0]) continue;

          const nom = String(row[0] || '').trim();
          const reference = String(row[1] || '').trim();
          const unite = String(row[2] || '').trim();
          const quantite = parseFloat(String(row[3] || '0'));
          const description = String(row[4] || '').trim();

          // Ajouter seulement si au moins le nom est renseigné
          if (nom) {
            items.push({
              nom,
              reference,
              unite,
              quantite: isNaN(quantite) ? 0 : quantite,
              description,
            });
          }
        }

        resolve(items);
      } catch (error) {
        reject(new Error('Erreur lors de la lecture du fichier Excel. Vérifiez le format.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier.'));
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Valide les items parsés depuis Excel
 * @param items - Les items à valider
 * @returns Un objet avec isValid et errors
 */
export function validateExcelItems(items: ExcelItem[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (items.length === 0) {
    errors.push('Le fichier ne contient aucun item valide.');
    return { isValid: false, errors };
  }

  items.forEach((item, index) => {
    const rowNumber = index + 2; // +2 car ligne 1 = en-têtes, et index commence à 0

    if (!item.nom || item.nom.trim() === '') {
      errors.push(`Ligne ${rowNumber}: Le nom de l'article est obligatoire.`);
    }

    if (item.quantite <= 0) {
      errors.push(`Ligne ${rowNumber}: La quantité doit être supérieure à 0.`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
