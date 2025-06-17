"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  FileText,
  FileImage,
  FileIcon as FilePdf,
  FileSpreadsheet,
  Search,
  MoreHorizontal,
  Download,
  Share2,
  Trash2,
  Loader2,
  AlertCircle,
  FolderIcon,
  FolderOpenIcon,
  LayoutGrid,
  ListChecks,
  PlusCircle,
  HomeIcon,
  FolderPlus,
  Edit3,
  Trash,
} from "lucide-react";
import { documentService, type Document } from "@/lib/document-service";
import {
  getCategoriesForUser,
  addCategoryForUser,
  deleteCategoryAndContents,
  renameCategory,
  type Category
} from "@/lib/category-service";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { supabaseBrowserClient as supabase } from "@/lib/supabase";

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

// Función para generar URLs firmadas para visualización
async function generateClientSignedUrl(filePath: string, expiresInSeconds: number = 300): Promise<string | null> {
  if (!filePath) return null;
  try {
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(filePath, expiresInSeconds);
    if (error) { console.error(`[generateClientSignedUrl] Error creating signed URL for ${filePath}:`, error); return null; }
    return data?.signedUrl ?? null;
  } catch (error) { console.error(`[generateClientSignedUrl] Exception creating signed URL for ${filePath}:`, error); return null; }
}

// Función para generar URLs firmadas específicamente para descargas
async function generateClientDownloadUrl(filePath: string, fileNameToSuggest: string, expiresInSeconds: number = 300): Promise<string | null> {
  console.log(`[generateClientDownloadUrl] Requesting download URL for filePath: "${filePath}", suggested filename: "${fileNameToSuggest}"`);
  if (!filePath) {
    console.error("[generateClientDownloadUrl] No filePath provided.");
    return null;
  }
  try {
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(filePath, expiresInSeconds, {
        download: fileNameToSuggest
      });

    if (error) {
      console.error(`[generateClientDownloadUrl] Error creating download signed URL for "${filePath}":`, JSON.stringify(error, null, 2));
      toast({ title: "Error de Supabase", description: `No se pudo crear URL de descarga: ${error.message}`, variant: "destructive"});
      return null;
    }
    if (!data || !data.signedUrl) {
      console.error(`[generateClientDownloadUrl] No signed URL data returned for "${filePath}".`);
      toast({ title: "Error Interno", description: "No se recibió URL firmada de Supabase.", variant: "destructive"});
      return null;
    }
    console.log(`[generateClientDownloadUrl] Generated download URL for "${filePath}": ${data.signedUrl}`);
    return data.signedUrl;
  } catch (error: any) {
    console.error(`[generateClientDownloadUrl] Exception creating download signed URL for "${filePath}":`, error);
    toast({ title: "Error de Excepción", description: `No se pudo crear URL: ${error.message}`, variant: "destructive"});
    return null;
  }
}

// Función auxiliar para sanitizar nombres de archivo
function sanitizeFilename(filename: string): string {
  let sanitized = filename.replace(/[<>:"\/\\|?*\x00-\x1F]/g, '_');
  sanitized = sanitized.replace(/\s+/g, '_');
  sanitized = sanitized.replace(/__+/g, '_');
  sanitized = sanitized.substring(0, 200);
  console.log(`[sanitizeFilename] Original: "${filename}", Sanitized: "${sanitized}"`);
  return sanitized;
}

export default function DocumentosPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const [subFolders, setSubFolders] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ id: null, name: "Mis Carpetas" }]);
  const [currentFolderName, setCurrentFolderName] = useState("Mis Carpetas");

  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [documentsError, setDocumentsError] = useState<string | null>(null);

  const [deleteDocDialogOpen, setDeleteDocDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false); 

  const [newFolderName, setNewFolderName] = useState("");
  const [isProcessingFolder, setIsProcessingFolder] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);

  const [renameFolderDialogOpen, setRenameFolderDialogOpen] = useState(false);
  const [folderToRename, setFolderToRename] = useState<Category | null>(null);
  const [renamingFolderName, setRenamingFolderName] = useState("");

  const [deleteFolderDialogOpen, setDeleteFolderDialogOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<{ id: string, name: string } | null>(null);

  const fetchCurrentLevelData = useCallback(async () => {
    setIsLoadingCategories(true); setIsLoadingDocuments(true);
    setCategoryError(null); setDocumentsError(null);
    try {
      const fetchedCategories = await getCategoriesForUser(currentParentId);
      setSubFolders(fetchedCategories);
    } catch (err: any) { console.error("Error fetching sub-categories:", err); setCategoryError("No se pudieron cargar las subcarpetas."); setSubFolders([]); }
    finally { setIsLoadingCategories(false); }

    try {
      let docs: Document[];
      if (currentParentId === null) {
        docs = await documentService.getDocumentsByCategory("General");
      } else {
        docs = await documentService.getDocumentsByCategory(currentFolderName);
      }
      setDocuments(docs);
    } catch (error) {
      console.error(`Error fetching docs for "${currentParentId === null ? "General" : currentFolderName}":`, error);
      setDocumentsError(`Error al cargar documentos de "${currentParentId === null ? "General" : currentFolderName}".`);
      setDocuments([]);
    }
    finally { setIsLoadingDocuments(false); }
  }, [currentParentId, currentFolderName]);

  useEffect(() => { fetchCurrentLevelData(); }, [fetchCurrentLevelData]);

  useEffect(() => {
    let tempFiltered = [...documents];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      tempFiltered = tempFiltered.filter((doc) => doc.name.toLowerCase().includes(query) || (doc.tags && doc.tags.some((tag) => tag.toLowerCase().includes(query))));
    }
    setFilteredDocuments(tempFiltered);
  }, [searchQuery, documents]);

  // ✨ NUEVO COMPONENTE INTERNO PARA MANEJAR MINIATURAS DE IMAGEN DE FORMA SEGURA ✨
  const DocumentImageThumbnail = ({ doc }: { doc: Document }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const generateUrl = async () => {
        if (doc.file_path) {
          // Generamos una URL segura y de corta duración solo para la miniatura
          const signedUrl = await generateClientSignedUrl(doc.file_path, 300); // 5 minutos de validez
          setImageUrl(signedUrl);
        }
        setIsLoading(false);
      };

      generateUrl();
    }, [doc.file_path]);

    if (isLoading) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (imageUrl) {
      return (
        <img
          src={imageUrl}
          alt={doc.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      );
    }
    
    // Fallback si la generación de URL falla
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <FileImage className="h-12 w-12 text-blue-500" />
      </div>
    );
  };

  // ✨ FUNCIÓN DE MINIATURAS ACTUALIZADA PARA USAR EL NUEVO COMPONENTE ✨
  const getDocumentThumbnail = (doc: Document) => {
    const fileType = doc.file_type?.toLowerCase() || "";
    
    if (["jpg", "jpeg", "png", "gif", "webp", "heic", "heif"].includes(fileType)) {
      return (
        <div className="relative w-full aspect-[4/3] bg-muted rounded-t-lg overflow-hidden group">
          <DocumentImageThumbnail doc={doc} />
        </div>
      );
    } else if (fileType === "pdf") {
      return <div className="relative w-full aspect-[4/3] bg-red-50 dark:bg-red-900/30 rounded-t-lg flex items-center justify-center group"><FilePdf className="h-12 w-12 text-red-500 dark:text-red-400 transition-transform duration-300 group-hover:scale-110" /></div>;
    } else if (["doc", "docx", "msword", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(fileType)) {
        return <div className="relative w-full aspect-[4/3] bg-sky-50 dark:bg-sky-900/30 rounded-t-lg flex items-center justify-center group"><FileText className="h-12 w-12 text-sky-500 dark:text-sky-400 transition-transform duration-300 group-hover:scale-110" /></div>;
    }
    else {
      const IconElement = getFileIcon(fileType);
      return <div className="relative w-full aspect-[4/3] bg-slate-100 dark:bg-slate-800 rounded-t-lg flex items-center justify-center group">{React.cloneElement(IconElement, { className: "h-12 w-12 text-slate-500 dark:text-slate-400 transition-transform duration-300 group-hover:scale-110" })}</div>;
    }
  };

  const handleNavigateToCategory = (categoryTarget: Category | BreadcrumbItem) => {
    if (categoryTarget.id === currentParentId && categoryTarget.name === currentFolderName) return;
    setCurrentParentId(categoryTarget.id); setCurrentFolderName(categoryTarget.name);
    if (categoryTarget.id === null) { setBreadcrumbs([{ id: null, name: "Mis Carpetas" }]); }
    else {
      const existingCrumbIndex = breadcrumbs.findIndex(b => b.id === categoryTarget.id);
      if (existingCrumbIndex !== -1) { setBreadcrumbs(breadcrumbs.slice(0, existingCrumbIndex + 1)); }
      else { const newCrumb: BreadcrumbItem = { id: categoryTarget.id!, name: categoryTarget.name }; setBreadcrumbs([...breadcrumbs, newCrumb]); }
    }
    setSearchQuery("");
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) { toast({ title: "Nombre inválido", description: "El nombre de la carpeta no puede estar vacío.", variant: "destructive" }); return; }
    setIsProcessingFolder(true);
    try {
      await addCategoryForUser(newFolderName.trim(), currentParentId);
      toast({ title: "Éxito", description: `Carpeta "${newFolderName.trim()}" creada.` });
      setNewFolderName(""); setCreateFolderDialogOpen(false);
      await fetchCurrentLevelData();
    } catch (error: any) { console.error("Error creating folder:", error); toast({ title: "Error al crear carpeta", description: error.message || "No se pudo crear.", variant: "destructive" }); }
    finally { setIsProcessingFolder(false); }
  };

  const openRenameDialog = (category: Category) => {
    setFolderToRename(category);
    setRenamingFolderName(category.name);
    setRenameFolderDialogOpen(true);
  };

  const handleRenameFolder = async () => {
    if (!folderToRename || !renamingFolderName.trim()) { toast({ title: "Nombre inválido", description: "El nuevo nombre no puede estar vacío.", variant: "destructive" }); return; }
    if (folderToRename.name === renamingFolderName.trim()) { setRenameFolderDialogOpen(false); return; }
    setIsProcessingFolder(true);
    try {
      const updatedFolder = await renameCategory(folderToRename.id, renamingFolderName.trim());
      toast({ title: "Éxito", description: `Carpeta renombrada a "${renamingFolderName.trim()}".` });
      setBreadcrumbs(prev => prev.map(b => b.id === updatedFolder.id ? { ...b, name: updatedFolder.name } : b));
      if (currentParentId === folderToRename.parent_id && currentFolderName === folderToRename.name) {
          setCurrentFolderName(updatedFolder.name);
      } else if (breadcrumbs.some(b => b.id === updatedFolder.id)) {
        if (currentParentId === updatedFolder.id) {
          setCurrentFolderName(updatedFolder.name);
        }
      }
      setRenamingFolderName(""); setRenameFolderDialogOpen(false); setFolderToRename(null);
      await fetchCurrentLevelData();
    } catch (error: any) {
      console.error("Error renaming folder:", error);
      toast({ title: "Error al renombrar", description: error.message || "No se pudo renombrar.", variant: "destructive" });
    } finally {
      setIsProcessingFolder(false);
    }
  };

  const confirmDeleteFolder = (categoryId: string, categoryName: string) => { setFolderToDelete({ id: categoryId, name: categoryName }); setDeleteFolderDialogOpen(true); };

  const handleDeleteFolderConfirmed = async () => {
    if (!folderToDelete) return; setIsProcessingFolder(true);
    try {
      await deleteCategoryAndContents(folderToDelete.id);
      toast({ title: "Carpeta Eliminada", description: `La carpeta "${folderToDelete.name}" y su contenido han sido eliminados.` });
      if (folderToDelete.id === currentParentId) {
        const parentCrumbIndex = breadcrumbs.findIndex(b => b.id === folderToDelete.id) - 1;
        const parentToNavigate = parentCrumbIndex >= 0 ? breadcrumbs[parentCrumbIndex] : { id: null, name: "Mis Carpetas" };
        handleNavigateToCategory(parentToNavigate);
      } else { await fetchCurrentLevelData(); }
      setDeleteFolderDialogOpen(false); setFolderToDelete(null);
    } catch (error: any) { console.error("Error deleting folder:", error); toast({ title: "Error al Eliminar Carpeta", description: error.message, variant: "destructive" }); }
    finally { setIsProcessingFolder(false); }
  };

  const handleViewDocumentDetails = (id: string) => router.push(`/dashboard/documentos/${id}`);

  const handleOpenDocumentLink = async (doc: Document) => {
    console.log("[handleOpenDocumentLink] Attempting to open document:", JSON.stringify(doc, null, 2));
    if (!doc.file_path) { toast({ title: "Error", description: "Ruta de archivo no disponible.", variant: "destructive" }); return; }
    try {
      const signedUrl = await generateClientSignedUrl(doc.file_path, 300);
      if (signedUrl) {
        console.log("[handleOpenDocumentLink] Opening URL:", signedUrl);
        window.open(signedUrl, "_blank");
      }
      else {
        toast({ title: "Error", description: "No se pudo generar el enlace seguro para el documento.", variant: "destructive" });
        console.error("[handleOpenDocumentLink] Failed to get signed URL for viewing.");
      }
    } catch (error: any) {
      toast({ title: "Error", description: `No se pudo abrir el documento: ${error.message}`, variant: "destructive" });
      console.error("[handleOpenDocumentLink] Exception:", error);
    }
  };

  const handleDownloadDocument = async (doc: Document) => {
    console.log("[handleDownloadDocument] Attempting to download document:", JSON.stringify(doc, null, 2));
    if (!doc.file_path) {
      toast({ title: "Error de Descarga", description: "Ruta de archivo no disponible en el objeto del documento.", variant: "destructive" });
      console.error("[handleDownloadDocument] doc.file_path is missing.");
      return;
    }

    try {
      let rawFileName = doc.name || doc.file_path.split('/').pop();
      if (!rawFileName) {
          console.warn("[handleDownloadDocument] Could not determine a raw filename, defaulting to 'documento'.");
          rawFileName = 'documento';
      }

      if (rawFileName.lastIndexOf('.') === -1 && doc.file_type && doc.file_type.trim() !== '') {
        const safeFileType = doc.file_type.startsWith('.') ? doc.file_type.substring(1) : doc.file_type;
        if (safeFileType) {
            rawFileName = `${rawFileName}.${safeFileType}`;
        }
      }

      const fileNameToSuggest = sanitizeFilename(rawFileName);

      console.log(`[handleDownloadDocument] file_path: "${doc.file_path}", Original name for suggestion: "${rawFileName}", Sanitized suggested filename: "${fileNameToSuggest}"`);

      const signedUrl = await generateClientDownloadUrl(doc.file_path, fileNameToSuggest, 300);

      if (signedUrl) {
        console.log(`[handleDownloadDocument] Received signed URL: ${signedUrl}. Attempting to trigger download for filename: "${fileNameToSuggest}".`);
        const link = document.createElement('a');
        link.href = signedUrl;
        link.setAttribute('download', fileNameToSuggest);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        link.remove();
        console.log("[handleDownloadDocument] Download link clicked.");
        toast({ title: "Descarga Iniciada", description: `Descargando "${fileNameToSuggest}"...`});
      } else {
        toast({ title: "Error de Descarga", description: "No se pudo generar el enlace de descarga. Revisa la consola del navegador para más detalles.", variant: "destructive" });
        console.error("[handleDownloadDocument] Failed to get signed URL from generateClientDownloadUrl.");
      }
    } catch (error: any) {
      console.error("[handleDownloadDocument] Exception during download process:", error);
      toast({ title: "Error de Descarga", description: `Excepción: ${error.message}`, variant: "destructive" });
    }
  };

  const handleShareDocument = (id: string) => router.push(`/dashboard/compartir/${id}`);

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;

    setIsDeletingDoc(true);
    setDocumentsError(null);

    try {
      await documentService.deleteDocument(documentToDelete);
      toast({ title: "Documento Eliminado", description: "El documento ha sido eliminado." });
      setDeleteDocDialogOpen(false);
      await fetchCurrentLevelData();

    } catch (error: any) {
      console.error("Error deleting document:", error);
      setDocumentsError("Error al eliminar el documento.");
      toast({ title: "Error", description: "No se pudo eliminar el documento.", variant: "destructive" });
      setDeleteDocDialogOpen(false);
    } finally {
      setDocumentToDelete(null);
      setIsDeletingDoc(false);
    }
  };

  const confirmDeleteDoc = (id: string) => { setDocumentToDelete(id); setDeleteDocDialogOpen(true); };

  const getFileIcon = (type: string | null | undefined) => {
    switch (type?.toLowerCase()) {
      case "pdf": return <FilePdf className="h-5 w-5 text-red-500" />;
      case "jpg": case "jpeg": case "png": case "gif": case "webp": case "heic": case "heif": return <FileImage className="h-5 w-5 text-blue-500" />;
      case "doc": case "docx": case "msword": case "application/msword": case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": return <FileText className="h-5 w-5 text-sky-500" />;
      case "xls": case "xlsx": case "csv": return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
      default: return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };
  const getStatusBadge = (status: string | null | undefined) => {
    switch (status?.toLowerCase()) {
      case "vigente": return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 dark:bg-green-700/20 dark:text-green-400 dark:border-green-600">Vigente</Badge>;
      case "próximo a vencer": return <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-600/20 dark:text-yellow-400 dark:border-yellow-500">Próximo a vencer</Badge>;
      case "vencido": return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 dark:bg-red-700/20 dark:text-red-400 dark:border-red-600">Vencido</Badge>;
      default: return <Badge variant="secondary">{status || "Desconocido"}</Badge>;
    }
  };
  
  const FolderListItem = ({ category }: { category: Category }) => (
    <div
      className="flex items-center p-2.5 pr-1.5 rounded-md hover:bg-muted/50 group border-b last:border-b-0"
    >
      <button
        onClick={() => handleNavigateToCategory(category)}
        className="flex items-center flex-grow truncate mr-2 text-left cursor-pointer py-0.5"
      >
        <FolderIcon className="h-4 w-4 mr-2.5 flex-shrink-0 text-blue-500" />
        <span className="text-sm font-normal text-card-foreground truncate group-hover:text-primary">
          {category.name}
        </span>
      </button>
      <div onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-60 group-hover:opacity-100 ml-auto">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs">
            <DropdownMenuItem onClick={() => handleNavigateToCategory(category)}>
              <FolderOpenIcon className="mr-1.5 h-3.5 w-3.5" /> Abrir
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openRenameDialog(category)}>
              <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Renombrar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
              onClick={() => confirmDeleteFolder(category.id, category.name)}
            >
              <Trash className="mr-1.5 h-3.5 w-3.5" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  const FolderCard = ({ category }: { category: Category }) => (
    <div className="relative group rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow duration-150 flex flex-col aspect-[6/5]">
      <button
        onClick={() => handleNavigateToCategory(category)}
        className="flex flex-col items-center justify-center p-2.5 pt-3 flex-grow text-center w-full"
      >
        <FolderIcon className="h-8 w-8 mb-1.5 text-blue-500 group-hover:text-blue-600 transition-colors" />
        <span className="text-xs font-medium truncate w-full text-card-foreground group-hover:text-primary transition-colors leading-tight px-1">
          {category.name}
        </span>
      </button>
      <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleNavigateToCategory(category); }}>
              <FolderOpenIcon className="mr-1.5 h-3.5 w-3.5" /> Abrir
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openRenameDialog(category); }}><Edit3 className="mr-1.5 h-3.5 w-3.5" /> Renombrar</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={(e) => { e.stopPropagation(); confirmDeleteFolder(category.id, category.name); }}><Trash className="mr-1.5 h-3.5 w-3.5" /> Eliminar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  const handleUploadDocumentClick = () => {
    if (currentFolderName && currentFolderName !== "Mis Carpetas") {
      router.push(`/dashboard/subir?categoria=${encodeURIComponent(currentFolderName)}`);
    } else {
      router.push("/dashboard/subir");
    }
  };

  return (
    <div className="flex flex-col h-full bg-muted/20 dark:bg-background">
      <header className="p-4 md:px-6 md:py-3 border-b bg-background sticky top-0 z-20">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-muted-foreground overflow-hidden w-full sm:w-auto flex-wrap pb-1 sm:pb-0">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.id || 'root'}>
                {index > 0 && <span className="mx-0.5 text-muted-foreground/70">/</span>}
                <Button variant="link" className={cn("p-0 h-auto text-sm truncate hover:no-underline", index === breadcrumbs.length - 1 ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground")} onClick={() => handleNavigateToCategory(crumb)} disabled={index === breadcrumbs.length - 1}>
                  {index === 0 && breadcrumbs.length > 1 && <HomeIcon className="h-3.5 w-3.5 mr-1 shrink-0" />}
                  <span className="truncate max-w-[100px] sm:max-w-[150px]">{crumb.name}</span>
                </Button>
              </React.Fragment>
            ))}
          </div>
          <div 
            className="flex items-center gap-2 self-stretch sm:self-center w-full sm:w-auto justify-end sm:justify-between"
            suppressHydrationWarning // ✨ FIX ADDED HERE for hydration warning
          >
            <div className="relative flex-grow sm:flex-grow-0 sm:w-52 md:w-60">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input type="search" placeholder="Buscar aquí..." className="w-full pl-8 pr-3 h-9 text-xs rounded-md" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="border rounded-md flex bg-background overflow-hidden">
              <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-9 w-9 rounded-none border-r" onClick={() => setViewMode("list")}><ListChecks className="h-4 w-4" /></Button>
              <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-9 w-9 rounded-none" onClick={() => setViewMode("grid")}><LayoutGrid className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
        {/* ... Rest of the main content */}
        {(documentsError && !isLoadingDocuments && !isLoadingCategories) && (<Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{documentsError}</AlertDescription></Alert>)}
        {(categoryError && !isLoadingCategories) && (<Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{categoryError}</AlertDescription></Alert>)}

        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold tracking-tight">
              {currentParentId === null && breadcrumbs.length === 1 ? "Carpetas Principales" : `Carpetas en "${currentFolderName}"`}
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCreateFolderDialogOpen(true)} className="text-xs h-8 px-2.5">
                <FolderPlus className="mr-1.5 h-3.5 w-3.5" /> Nueva Carpeta
              </Button>
            </div>
          </div>
          {isLoadingCategories ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
                {Array.from({ length: currentParentId === null ? 4 : 3 }).map((_, i) => (<div key={i} className="flex flex-col items-center p-3 border rounded-lg bg-card animate-pulse aspect-[5/4] justify-center"> <div className="h-8 w-8 mb-1.5 bg-muted rounded-md"></div><div className="h-3 w-3/4 bg-muted rounded"></div> </div>))}
              </div>
            ) : (<div className="space-y-1 border rounded-lg bg-card p-1 shadow-sm"> {Array.from({ length: 3 }).map((_, i) => (<div key={i} className="flex items-center p-2.5 space-x-3 rounded-md bg-background animate-pulse"> <div className="h-5 w-5 bg-muted rounded-full"></div><div className="h-4 w-1/2 bg-muted rounded"></div> </div>))} </div>)
          ) : !categoryError && subFolders.length > 0 ? (
            viewMode === 'grid' ? (<div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4"> {subFolders.map((cat) => (<FolderCard key={cat.id} category={cat} />))} </div>)
              : (<div className="border rounded-lg bg-card shadow-sm divide-y divide-border"> {subFolders.map((cat) => (<FolderListItem key={cat.id} category={cat} />))} </div>)
          ) : !categoryError && subFolders.length === 0 && !(isLoadingDocuments || filteredDocuments.length > 0) ? (
            <p className="text-sm text-muted-foreground py-4 text-center italic">Esta carpeta no tiene subcarpetas.</p>
          ) : null}
        </div>

        {(subFolders.length > 0 && (isLoadingDocuments || filteredDocuments.length > 0)) && <hr className="my-6 border-dashed" />}

        <div>
            {(currentParentId !== null || (currentParentId === null && currentFolderName === "Mis Carpetas")) && (
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-semibold tracking-tight flex items-center">
                        Documentos {currentParentId !== null ? `en "${currentFolderName}"` : 'en "General" (Raíz)'}
                        {isLoadingDocuments && <Loader2 className="inline-block ml-2 h-4 w-4 animate-spin" />}
                    </h2>
                    {currentParentId !== null ? (
                        <Button size="sm" onClick={handleUploadDocumentClick} className="text-xs h-8 px-2.5">
                            <PlusCircle className="mr-1.5 h-3.5 w-3.5" />Subir a "{currentFolderName}"
                        </Button>
                    ) : (
                        <Button size="sm" onClick={handleUploadDocumentClick} className="text-xs h-8 px-2.5">
                            <PlusCircle className="mr-1.5 h-3.5 w-3.5" />Subir Documento
                        </Button>
                    )}
                </div>
            )}

            {isLoadingDocuments && filteredDocuments.length === 0 ? (
                <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : !isLoadingDocuments && filteredDocuments.length === 0 ? (
                <div className="text-center py-10 border rounded-lg bg-card shadow-sm">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground/60 mb-3" />
                    <h3 className="text-lg font-semibold text-card-foreground mb-1"> No hay documentos </h3>
                    <p className="text-muted-foreground px-4 text-sm">
                        {searchQuery ? "No hay documentos que coincidan con tu búsqueda." : (currentParentId === null ? "No hay documentos en la vista principal de 'General'." : `La carpeta "${currentFolderName}" está vacía.`)}
                    </p>
                </div>
            ) : (
                viewMode === "list" ? (
                  <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                    <div className="grid grid-cols-[auto_minmax(0,_1fr)_auto_auto_auto_auto] items-center gap-x-3 px-3 py-2.5 font-medium border-b bg-muted/40 text-xs text-muted-foreground uppercase tracking-wider">
                      <div className="pl-8">Tipo</div> <div>Nombre</div> <div>Categoría</div> <div>Fecha</div> <div>Estado</div> <div className="text-right pr-2">Acciones</div>
                    </div>
                    {filteredDocuments.map((doc) => (
                      <div key={doc.id} className="grid grid-cols-[auto_minmax(0,_1fr)_auto_auto_auto_auto] items-center gap-x-3 px-3 py-2.5 hover:bg-muted/80 dark:hover:bg-muted/20 transition-colors cursor-pointer border-b last:border-b-0 text-sm" >
                        <div className="flex justify-center items-center w-8 h-8" onClick={() => handleOpenDocumentLink(doc)}>{getFileIcon(doc.file_type)}</div>
                        <div className="truncate" onClick={() => handleOpenDocumentLink(doc)}>
                          <div className="font-medium text-card-foreground truncate" title={doc.name}>{doc.name}</div>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {doc.tags?.slice(0, 2).map((tag, i) => (<Badge key={i} variant="outline" className="text-xs px-1.5 py-0.5 font-normal">{tag}</Badge>))}
                            {doc.tags?.length > 2 && (<Badge variant="outline" className="text-xs px-1.5 py-0.5 font-normal">+{doc.tags.length - 2}</Badge>)}
                          </div>
                        </div>
                        <div className="text-muted-foreground truncate text-xs" title={doc.category || undefined} onClick={() => handleOpenDocumentLink(doc)}>{doc.category}</div>
                        <div className="text-muted-foreground text-xs" onClick={() => handleOpenDocumentLink(doc)}>{doc.date ? new Date(doc.date).toLocaleDateString() : '-'}</div>
                        <div onClick={() => handleOpenDocumentLink(doc)}>{getStatusBadge(doc.status)}</div>
                        <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Más</span></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleDownloadDocument(doc)}><Download className="mr-2 h-3.5 w-3.5" /><span>Descargar</span></DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleShareDocument(doc.id)}><Share2 className="mr-2 h-3.5 w-3.5" /><span>Compartir</span></DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewDocumentDetails(doc.id)}><Edit3 className="mr-2 h-3.5 w-3.5" /><span>Ver/Editar Detalles</span></DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => confirmDeleteDoc(doc.id)}><Trash2 className="mr-2 h-3.5 w-3.5" /><span>Eliminar Doc.</span></DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
                    {filteredDocuments.map((doc) => (
                      <div key={doc.id} className="rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col group" >
                        <div onClick={() => handleOpenDocumentLink(doc)} className="cursor-pointer">{getDocumentThumbnail(doc)}</div>
                        <div className="p-2.5 flex flex-col flex-grow">
                          <div className="flex items-start justify-between mb-0.5">
                            <h3 className="font-semibold text-xs sm:text-sm leading-tight tracking-tight truncate flex-grow mr-1.5 group-hover:text-primary" title={doc.name} onClick={() => handleOpenDocumentLink(doc)}>{doc.name}</h3>
                            <div onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-5 w-5 flex-shrink-0 opacity-60 group-hover:opacity-100"><MoreHorizontal className="h-3 w-3" /><span className="sr-only">Más</span></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleDownloadDocument(doc)}><Download className="mr-2 h-3.5 w-3.5" /><span>Descargar</span></DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleShareDocument(doc.id)}><Share2 className="mr-2 h-3.5 w-3.5" /><span>Compartir</span></DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleViewDocumentDetails(doc.id)}><Edit3 className="mr-2 h-3.5 w-3.5" /><span>Ver/Editar Detalles</span></DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => confirmDeleteDoc(doc.id)}><Trash2 className="mr-2 h-3.5 w-3.5" /><span>Eliminar Doc.</span></DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-[11px] text-muted-foreground mb-1" onClick={() => handleOpenDocumentLink(doc)}> <span className="truncate" title={doc.category || undefined}>{doc.category}</span> {getStatusBadge(doc.status)} </div>
                          <div className="mt-auto flex flex-wrap gap-0.5" onClick={() => handleOpenDocumentLink(doc)}>
                            {doc.tags?.slice(0, 2).map((tag, i) => (<Badge key={i} variant="secondary" className="text-[10px] px-1 py-0 font-normal">{tag}</Badge>))}
                            {doc.tags?.length > 2 && (<Badge variant="secondary" className="text-[10px] px-1 py-0 font-normal">+{doc.tags.length - 2}</Badge>)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
            )}
        </div>
      </main>

      {/* Dialogs */}
      <AlertDialog open={deleteDocDialogOpen} onOpenChange={(open) => {
        if (isDeletingDoc) return;
        setDeleteDocDialogOpen(open);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Documento</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el documento. ¿Estás seguro?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingDoc}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDocument}
              disabled={isDeletingDoc}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeletingDoc && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeletingDoc ? 'Eliminando...' : 'Eliminar Documento'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteFolderDialogOpen} onOpenChange={setDeleteFolderDialogOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Eliminar Carpeta "{folderToDelete?.name}"</AlertDialogTitle><AlertDialogDescription>¿Estás seguro? <span className="font-semibold text-destructive"> Se eliminarán todas las subcarpetas y documentos que contenga de forma permanente.</span> Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={isProcessingFolder}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteFolderConfirmed} className="bg-destructive hover:bg-destructive/90" disabled={isProcessingFolder}>{isProcessingFolder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sí, Eliminar Todo</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
      <Dialog open={createFolderDialogOpen} onOpenChange={setCreateFolderDialogOpen}>
        <DialogContent className="sm:max-w-[425px]"><DialogHeader><DialogTitle>Crear Nueva Carpeta</DialogTitle><DialogDescription>En "{currentFolderName}".</DialogDescription></DialogHeader><div className="grid gap-4 py-4"><div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="new-folder-name" className="text-right">Nombre</Label><Input id="new-folder-name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} className="col-span-3" placeholder="Ej: Radiografías" disabled={isProcessingFolder} /></div></div><DialogFooter><DialogClose asChild><Button type="button" variant="outline" disabled={isProcessingFolder}>Cancelar</Button></DialogClose><Button type="submit" onClick={handleCreateFolder} disabled={isProcessingFolder || !newFolderName.trim()}>{isProcessingFolder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Crear Carpeta</Button></DialogFooter></DialogContent>
      </Dialog>
      <Dialog open={renameFolderDialogOpen} onOpenChange={(open) => { if (!isProcessingFolder) { setRenameFolderDialogOpen(open); if (!open) setFolderToRename(null); } }}>
        <DialogContent className="sm:max-w-[425px]"><DialogHeader><DialogTitle>Renombrar Carpeta</DialogTitle><DialogDescription>Nuevo nombre para "{folderToRename?.name}".</DialogDescription></DialogHeader><div className="grid gap-4 py-4"><div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="renaming-folder-name" className="text-right">Nuevo Nombre</Label><Input id="renaming-folder-name" value={renamingFolderName} onChange={(e) => setRenamingFolderName(e.target.value)} className="col-span-3" placeholder="Nuevo nombre de carpeta" disabled={isProcessingFolder} /></div></div><DialogFooter><DialogClose asChild><Button type="button" variant="outline" disabled={isProcessingFolder}>Cancelar</Button></DialogClose><Button type="submit" onClick={handleRenameFolder} disabled={isProcessingFolder || !renamingFolderName.trim() || renamingFolderName.trim() === folderToRename?.name}>{isProcessingFolder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Renombrar</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}