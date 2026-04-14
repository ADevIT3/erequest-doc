import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@radix-ui/react-separator';
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ValidationPopup } from './validationForm/validationPopup'; // Importez votre nouveau composant
import { Toaster } from 'sonner'; // Importez le toaster

export default function DetailsRequetes() {
    const { requeteId } = useParams<{ requeteId?: string }>();
    const [isValidationPopupOpen, setIsValidationPopupOpen] = useState(false);

    const handleOpenValidationPopup = () => {
        setIsValidationPopupOpen(true);
    };

    const handleCloseValidationPopup = () => {
        setIsValidationPopupOpen(false);
    };

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage>Validation Requêtes</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="rounded-sm border bg-card p-4">
                    <h3 className="text-lg font-semibold mb-4">Détails de la requête</h3>
                    <hr />
                    <div className="flex flex-wrap items-center gap-2 md:flex-row pt-6">
                        <Button className="bg-blue-500 hover:bg-blue-600" onClick={handleOpenValidationPopup}>
                            Valider
                        </Button>
                        <Button className="bg-red-500 hover:bg-red-600">Refuser</Button>
                        <Button className="bg-green-500 hover:bg-green-600">Rediriger</Button>
                    </div>
                </div>
            </div>

            <ValidationPopup
                isOpen={isValidationPopupOpen}
                onClose={handleCloseValidationPopup}
                requeteId={requeteId}
            />
            <Toaster /> {/* Ajoutez le toaster à la racine de votre application ou à un niveau supérieur */}
        </>
    );
}