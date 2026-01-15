// app/dashboard/documentos/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
async function generateClientDownloadUrl(filePath: string, fileNameToSuggest: string, expiresInSeconds: number = 300): Promise<string | null> {
    if (!filePath) { console.error("[generateClientDownloadUrl] No filePath provided."); return null; }
    try {
        const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(filePath, expiresInSeconds, { download: fileNameToSuggest });
        if (error) { toast({ title: "Error de Supabase", description: `No se pudo crear URL de descarga: ${error.message}`, variant: "destructive"}); return null; }
        if (!data || !data.signedUrl) { toast({ title: "Error Interno", description: "No se recibió URL firmada de Supabase.", variant: "destructive"}); return null; }
        return data.signedUrl;
    } catch (error: any) { toast({ title: "Error de Excepción", description: `No se pudo crear URL: ${error.message}`, variant: "destructive"}); return null; }
}
function sanitizeFilename(filename: string): string {
    return filename.replace(/[<>:"\/\\|?*\x00-\x1F]/g, '_').replace(/\s+/g, '_').replace(/__+/g, '_').substring(0, 200);
}

export default function DocumentosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const [allCategories, setAllCategories] = useState<Category[]>([]);
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
    setIsLoadingDocuments(true);
    setDocumentsError(null);
    try {
      let docs: Document[];
      if (currentParentId === null) {
        docs = await documentService.getDocumentsByCategory("General");
      } else {
        docs = await documentService.getDocumentsByCategory(currentFolderName);
      }
      setDocuments(docs);
    } catch (error) {
      setDocumentsError(`Error al cargar documentos.`);
      setDocuments([]);
    } finally {
      setIsLoadingDocuments(false);
    }
  }, [currentParentId, currentFolderName]);
  
  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    setCategoryError(null);
    try {
        const fetchedCategories = await getCategoriesForUser(undefined, true);
        setAllCategories(fetchedCategories);
        setSubFolders(fetchedCategories.filter(c => c.parent_id === currentParentId));
    } catch (err: any) {
        setCategoryError("No se pudieron cargar las carpetas.");
        setAllCategories([]);
        setSubFolders([]);
    } finally {
        setIsLoadingCategories(false);
    }
  }, [currentParentId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchCurrentLevelData();
  }, [fetchCurrentLevelData]);

  useEffect(() => {
    let tempFiltered = [...documents];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      tempFiltered = tempFiltered.filter((doc) => doc.name.toLowerCase().includes(query) || (doc.tags && doc.tags.some((tag) => tag.toLowerCase().includes(query))));
    }
    setFilteredDocuments(tempFiltered);
  }, [searchQuery, documents]);

  useEffect(() => {
    const uploadSuccess = searchParams.get('upload_success');
    if (uploadSuccess !== 'true' || allCategories.length === 0) {
      return;
    }

    const docName = searchParams.get('doc_name');
    const categoryId = searchParams.get('category_id');
    const categoryName = searchParams.get('category_name');
    
    toast({
      title: 'Éxito',
      description: `El documento "${docName}" se ha subido correctamente.`,
    });

    if (categoryId && categoryName) {
      const newBreadcrumbs: BreadcrumbItem[] = [{ id: null, name: "Mis Carpetas" }];
      let currentCategory = allCategories.find(c => c.id === categoryId);
      const path = [];
      while(currentCategory) {
        path.unshift({ id: currentCategory.id, name: currentCategory.name });
        currentCategory = allCategories.find(c => c.id === currentCategory!.parent_id);
      }
      
      setBreadcrumbs([...newBreadcrumbs, ...path]);
      setCurrentParentId(categoryId);
      setCurrentFolderName(categoryName);
      setSubFolders(allCategories.filter(c => c.parent_id === categoryId));
    } else {
      setBreadcrumbs([{ id: null, name: "Mis Carpetas" }]);
      setCurrentParentId(null);
      setCurrentFolderName("Mis Carpetas");
      setSubFolders(allCategories.filter(c => c.parent_id === null));
    }

    router.replace('/dashboard/documentos', { scroll: false });
  }, [searchParams, allCategories, router]);

  const handleNavigateToCategory = (categoryTarget: Category | BreadcrumbItem) => {
    if (categoryTarget.id === currentParentId) return;

    setCurrentParentId(categoryTarget.id);
    setCurrentFolderName(categoryTarget.name);
    setSubFolders(allCategories.filter(c => c.parent_id === categoryTarget.id));
    
    if (categoryTarget.id === null) {
      setBreadcrumbs([{ id: null, name: "Mis Carpetas" }]);
    } else {
      const existingCrumbIndex = breadcrumbs.findIndex(b => b.id === categoryTarget.id);
      if (existingCrumbIndex !== -1) {
        setBreadcrumbs(breadcrumbs.slice(0, existingCrumbIndex + 1));
      } else {
        setBreadcrumbs([...breadcrumbs, { id: categoryTarget.id!, name: categoryTarget.name }]);
      }
    }
    setSearchQuery("");
  };

  const DocumentImageThumbnail = ({ doc }: { doc: Document }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
      const generateUrl = async () => {
        if (doc.file_path) setImageUrl(await generateClientSignedUrl(doc.file_path, 300));
        setIsLoading(false);
      };
      generateUrl();
    }, [doc.file_path]);
    if (isLoading) return <div className="w-full h-full flex items-center justify-center bg-muted"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
    if (imageUrl) return <img src={imageUrl} alt={doc.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />;
    return <div className="w-full h-full flex items-center justify-center bg-muted"><FileImage className="h-12 w-12 text-blue-500" /></div>;
  };
  const getDocumentThumbnail = (doc: Document) => {
    const fileType = doc.file_type?.toLowerCase() || "";
    if (["jpg", "jpeg", "png", "gif", "webp", "heic", "heif"].includes(fileType)) return <div className="relative w-full aspect-[4/3] bg-muted rounded-t-lg overflow-hidden group"><DocumentImageThumbnail doc={doc} /></div>;
    if (fileType === "pdf") return <div className="relative w-full aspect-[4/3] bg-red-50 dark:bg-red-900/30 rounded-t-lg flex items-center justify-center group"><FilePdf className="h-12 w-12 text-red-500 dark:text-red-400" /></div>;
    if (["doc", "docx"].includes(fileType)) return <div className="relative w-full aspect-[4/3] bg-sky-50 dark:bg-sky-900/30 rounded-t-lg flex items-center justify-center group"><FileText className="h-12 w-12 text-sky-500 dark:text-sky-400" /></div>;
    const Icon = getFileIcon(fileType);
    return <div className="relative w-full aspect-[4/3] bg-slate-100 dark:bg-slate-800 rounded-t-lg flex items-center justify-center group">{React.cloneElement(Icon, { className: "h-12 w-12 text-slate-500" })}</div>;
  };
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setIsProcessingFolder(true);
    try {
      await addCategoryForUser(newFolderName.trim(), currentParentId);
      toast({ title: "Éxito", description: "Carpeta creada." });
      setNewFolderName(""); setCreateFolderDialogOpen(false);
      fetchCategories();
    } catch (error: any) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    finally { setIsProcessingFolder(false); }
  };
  const openRenameDialog = (category: Category) => { setFolderToRename(category); setRenamingFolderName(category.name); setRenameFolderDialogOpen(true); };
  const handleRenameFolder = async () => {
    if (!folderToRename || !renamingFolderName.trim() || folderToRename.name === renamingFolderName.trim()) return;
    setIsProcessingFolder(true);
    try {
      await renameCategory(folderToRename.id, renamingFolderName.trim());
      toast({ title: "Éxito", description: "Carpeta renombrada." });
      setRenameFolderDialogOpen(false); setFolderToRename(null);
      fetchCategories();
    } catch (error: any) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    finally { setIsProcessingFolder(false); }
  };
  const confirmDeleteFolder = (categoryId: string, categoryName: string) => { setFolderToDelete({ id: categoryId, name: categoryName }); setDeleteFolderDialogOpen(true); };
  const handleDeleteFolderConfirmed = async () => {
    if (!folderToDelete) return;
    setIsProcessingFolder(true);
    try {
      await deleteCategoryAndContents(folderToDelete.id);
      toast({ title: "Carpeta Eliminada" });
      setDeleteFolderDialogOpen(false); setFolderToDelete(null);
      if (folderToDelete.id === currentParentId) { handleNavigateToCategory({ id: null, name: "Mis Carpetas" }); }
      else { fetchCategories(); }
    } catch (error: any) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    finally { setIsProcessingFolder(false); }
  };
  const handleViewDocumentDetails = (id: string) => router.push(`/dashboard/documentos/${id}`);
  const handleOpenDocumentLink = async (doc: Document) => {
    if (!doc.file_path) return;
    const signedUrl = await generateClientSignedUrl(doc.file_path, 300);
    if (signedUrl) window.open(signedUrl, "_blank");
    else toast({ title: "Error", description: "No se pudo generar el enlace.", variant: "destructive" });
  };
  const handleDownloadDocument = async (doc: Document) => {
    if (!doc.file_path) return;
    const fileNameToSuggest = sanitizeFilename(doc.name || 'documento');
    const signedUrl = await generateClientDownloadUrl(doc.file_path, fileNameToSuggest, 300);
    if (signedUrl) {
      const link = document.createElement('a');
      link.href = signedUrl;
      link.download = fileNameToSuggest;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else { toast({ title: "Error", description: "No se pudo generar enlace de descarga.", variant: "destructive" }); }
  };
  const handleShareDocument = (id: string) => router.push(`/dashboard/compartir/${id}`);
  const confirmDeleteDoc = (id: string) => { setDocumentToDelete(id); setDeleteDocDialogOpen(true); };
  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;
    setIsDeletingDoc(true);
    try {
      await documentService.deleteDocument(documentToDelete);
      toast({ title: "Documento eliminado" });
      setDeleteDocDialogOpen(false);
      fetchCurrentLevelData();
    } catch (error: any) { toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" }); }
    finally { setIsDeletingDoc(false); setDocumentToDelete(null); }
  };
  const getFileIcon = (type: string | null | undefined) => {
    switch (type?.toLowerCase()) {
      case "pdf": return <FilePdf className="h-5 w-5 text-red-500" />;
      case "jpg": case "jpeg": case "png": case "gif": case "webp": case "heic": case "heif": return <FileImage className="h-5 w-5 text-blue-500" />;
      case "doc": case "docx": return <FileText className="h-5 w-5 text-sky-500" />;
      default: return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };
  const getStatusBadge = (status: string | null | undefined) => {
    switch (status?.toLowerCase()) {
      case "vigente": return <Badge variant="outline" className="text-green-700 border-green-300">Vigente</Badge>;
      case "próximo a vencer": return <Badge variant="outline" className="text-yellow-700 border-yellow-300">Próximo a vencer</Badge>;
      case "vencido": return <Badge variant="outline" className="text-red-700 border-red-300">Vencido</Badge>;
      default: return <Badge variant="secondary">{status || "N/A"}</Badge>;
    }
  };
  const FolderListItem = ({ category }: { category: Category }) => (
    <div className="flex items-center p-2.5 pr-1.5 rounded-md hover:bg-muted/50 group border-b last:border-b-0"><button onClick={() => handleNavigateToCategory(category)} className="flex items-center flex-grow truncate mr-2 text-left"><FolderIcon className="h-4 w-4 mr-2.5 flex-shrink-0 text-blue-500" /><span className="text-sm font-normal truncate">{category.name}</span></button><div><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 opacity-60 group-hover:opacity-100"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => handleNavigateToCategory(category)}><FolderOpenIcon className="mr-1.5 h-3.5 w-3.5" /> Abrir</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={() => openRenameDialog(category)}><Edit3 className="mr-1.5 h-3.5 w-3.5" /> Renombrar</DropdownMenuItem><DropdownMenuItem className="text-destructive" onClick={() => confirmDeleteFolder(category.id, category.name)}><Trash className="mr-1.5 h-3.5 w-3.5" /> Eliminar</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></div>
  );
  const FolderCard = ({ category }: { category: Category }) => (
    <div className="relative group rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow"><button onClick={() => handleNavigateToCategory(category)} className="flex flex-col items-center justify-center p-2.5 pt-3 flex-grow text-center w-full"><FolderIcon className="h-8 w-8 mb-1.5 text-blue-500" /><span className="text-xs font-medium truncate w-full">{category.name}</span></button><div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => handleNavigateToCategory(category)}><FolderOpenIcon className="mr-1.5 h-3.5 w-3.5" /> Abrir</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={() => openRenameDialog(category)}><Edit3 className="mr-1.5 h-3.5 w-3.5" /> Renombrar</DropdownMenuItem><DropdownMenuItem className="text-destructive" onClick={() => confirmDeleteFolder(category.id, category.name)}><Trash className="mr-1.5 h-3.5 w-3.5" /> Eliminar</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></div>
  );
  const handleUploadDocumentClick = () => {
    if (currentFolderName && currentFolderName !== "Mis Carpetas") router.push(`/dashboard/subir?categoria=${encodeURIComponent(currentFolderName)}`);
    else router.push("/dashboard/subir");
  };

  return (
    <>
      {/* Page Header Section */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent">
            {currentFolderName}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Organiza y gestiona tus documentos médicos
          </p>
        </div>
      </div>

      {/* Breadcrumbs and Controls */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-500 delay-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2">
        <div className="flex items-center gap-1 text-sm flex-wrap">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.id || 'root'}>
              {index > 0 && <span className="mx-1 text-gray-400">/</span>}
              <button
                onClick={() => handleNavigateToCategory(crumb)}
                disabled={index === breadcrumbs.length - 1}
                className={cn(
                  "px-2 py-1 rounded transition-colors",
                  index === breadcrumbs.length - 1
                    ? "font-semibold text-foreground cursor-default"
                    : "text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                )}
              >
                {index === 0 && breadcrumbs.length > 1 && <HomeIcon className="h-4 w-4 inline mr-1" />}
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50 p-1">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 rounded transition-colors",
              viewMode === "list"
                ? "bg-white dark:bg-slate-800 shadow-sm"
                : "hover:bg-slate-200 dark:hover:bg-slate-700"
            )}
            title="Vista de lista"
          >
            <ListChecks className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-2 rounded transition-colors",
              viewMode === "grid"
                ? "bg-white dark:bg-slate-800 shadow-sm"
                : "hover:bg-slate-200 dark:hover:bg-slate-700"
            )}
            title="Vista de cuadrícula"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="animate-in fade-in slide-in-from-left-4 duration-500 delay-150">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Buscar documentos por nombre o etiquetas..."
            className="w-full pl-10 pr-3 h-10 rounded-lg bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Error Alert */}
      {(documentsError || categoryError) && (
        <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{documentsError || categoryError}</AlertDescription>
        </Alert>
      )}

      {/* Folders Section */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FolderIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Carpetas
          </h2>
          <Button size="sm" onClick={() => setCreateFolderDialogOpen(true)} className="gap-1.5">
            <FolderPlus className="h-4 w-4" />
            Nueva Carpeta
          </Button>
        </div>

        {isLoadingCategories ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : subFolders.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
              {subFolders.map((cat, idx) => (
                <div
                  key={cat.id}
                  className="animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <FolderCard category={cat} />
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              {subFolders.map((cat, idx) => (
                <div
                  key={cat.id}
                  className="animate-in fade-in slide-in-from-left-2 border-b last:border-b-0 dark:border-slate-700"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <FolderListItem category={cat} />
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 italic">
            📁 No hay carpetas en esta ubicación
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-700" />
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">DOCUMENTOS</span>
        <div className="flex-1 h-px bg-gradient-to-l from-slate-200 to-transparent dark:from-slate-700" />
      </div>

      {/* Documents Section */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            Documentos
          </h2>
          <Button size="sm" onClick={handleUploadDocumentClick} className="gap-1.5 bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-600">
            <PlusCircle className="h-4 w-4" />
            Subir Documento
          </Button>
        </div>

        {isLoadingDocuments ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-900/20">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-semibold">No hay documentos</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {searchQuery ? "No hay coincidencias con tu búsqueda" : "Esta carpeta está vacía"}
            </p>
            {!searchQuery && (
              <Button size="sm" onClick={handleUploadDocumentClick} className="mt-4" variant="outline">
                Subir tu primer documento
              </Button>
            )}
          </div>
        ) : viewMode === "list" ? (
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            {filteredDocuments.map((doc, idx) => (
              <div
                key={doc.id}
                className="grid grid-cols-[auto_minmax(0,_1fr)_auto_auto_auto] items-center gap-x-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 border-b last:border-b-0 dark:border-slate-700 text-sm transition-colors animate-in fade-in"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <div className="flex justify-center items-center w-8 h-8 text-lg" onClick={() => handleOpenDocumentLink(doc)}>
                  {getFileIcon(doc.file_type)}
                </div>
                <div className="truncate cursor-pointer" onClick={() => handleOpenDocumentLink(doc)}>
                  <div className="font-medium truncate hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" title={doc.name}>
                    {doc.name}
                  </div>
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-xs" onClick={() => handleOpenDocumentLink(doc)}>
                  {doc.date ? new Date(doc.date).toLocaleDateString("es-MX") : "-"}
                </div>
                <div onClick={() => handleOpenDocumentLink(doc)}>{getStatusBadge(doc.status)}</div>
                <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDownloadDocument(doc)}>
                        <Download className="mr-2 h-3.5 w-3.5" />
                        Descargar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShareDocument(doc.id)}>
                        <Share2 className="mr-2 h-3.5 w-3.5" />
                        Compartir
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleViewDocumentDetails(doc.id)}>
                        <Edit3 className="mr-2 h-3.5 w-3.5" />
                        Ver/Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => confirmDeleteDoc(doc.id)}>
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredDocuments.map((doc, idx) => (
              <div
                key={doc.id}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300 group animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div onClick={() => handleOpenDocumentLink(doc)} className="cursor-pointer overflow-hidden bg-gray-100 dark:bg-slate-800 group-hover:bg-gray-200 dark:group-hover:bg-slate-700 transition-colors">
                  {getDocumentThumbnail(doc)}
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm leading-tight truncate flex-grow text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer" title={doc.name} onClick={() => handleOpenDocumentLink(doc)}>
                      {doc.name}
                    </h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5 flex-shrink-0 opacity-60 group-hover:opacity-100">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownloadDocument(doc)}>
                          <Download className="mr-2 h-3.5 w-3.5" />
                          Descargar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShareDocument(doc.id)}>
                          <Share2 className="mr-2 h-3.5 w-3.5" />
                          Compartir
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleViewDocumentDetails(doc.id)}>
                          <Edit3 className="mr-2 h-3.5 w-3.5" />
                          Ver/Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => confirmDeleteDoc(doc.id)}>
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center">
                    <span>{doc.date ? new Date(doc.date).toLocaleDateString("es-MX") : "-"}</span>
                    {getStatusBadge(doc.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AlertDialog open={deleteDocDialogOpen} onOpenChange={setDeleteDocDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Documento</AlertDialogTitle>
            <AlertDialogDescription>Esta acción es permanente. ¿Estás seguro?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingDoc}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDocument} disabled={isDeletingDoc} className="bg-destructive hover:bg-destructive/90">
              {isDeletingDoc && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteFolderDialogOpen} onOpenChange={setDeleteFolderDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Carpeta "{folderToDelete?.name}"</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-destructive">Se eliminarán todas las subcarpetas y documentos que contenga de forma permanente.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingFolder}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFolderConfirmed} className="bg-destructive hover:bg-destructive/90" disabled={isProcessingFolder}>
              {isProcessingFolder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sí, Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={createFolderDialogOpen} onOpenChange={setCreateFolderDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Crear Carpeta</DialogTitle>
            <DialogDescription>En "{currentFolderName}".</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="new-folder-name">Nombre</Label>
            <Input
              id="new-folder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              disabled={isProcessingFolder}
              placeholder="Mi Nueva Carpeta"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateFolderDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateFolder} disabled={isProcessingFolder || !newFolderName.trim()}>
              {isProcessingFolder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renameFolderDialogOpen} onOpenChange={setRenameFolderDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Renombrar Carpeta</DialogTitle>
            <DialogDescription>Nuevo nombre para "{folderToRename?.name}".</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="renaming-folder-name">Nuevo Nombre</Label>
            <Input
              id="renaming-folder-name"
              value={renamingFolderName}
              onChange={(e) => setRenamingFolderName(e.target.value)}
              disabled={isProcessingFolder}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRenameFolderDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRenameFolder} disabled={isProcessingFolder || !renamingFolderName.trim()}>
              {isProcessingFolder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Renombrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}