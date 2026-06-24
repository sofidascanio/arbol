import { useCallback } from 'react';
import { Modal } from '@/components/ui/Modal/Modal';
import { BookmarkForm } from '@/components/BookmarkForm/BookmarkForm';
import { Button } from '@/components/ui/Button/Button';
import { Folder } from '@/types';
import { bookmarkService, CreateBookmarkInput } from '@/services/bookmark.service';
import { useToastContext } from '@/context/ToastContext';

interface NewBookmarkModalProps {
    isOpen: boolean;
    onClose: () => void;
    folders: Folder[];
    onSuccess: () => void;
}

export const NewBookmarkModal = ({
    isOpen,
    onClose,
    folders,
    onSuccess,
}: NewBookmarkModalProps) => {
    const toast = useToastContext();

    const handleSubmit = useCallback(async (values: {
        title: string;
        url: string;
        description: string;
        folderId: string;
        tags: string[];
    }) => {
        const input: CreateBookmarkInput = {
            title: values.title,
            url: values.url,
            description: values.description || undefined,
            folderId: values.folderId || undefined,
            tagNames: values.tags,
        };

        await bookmarkService.create(input);
        toast.success('Marcador guardado correctamente');
        onSuccess();
        onClose();
    }, [toast, onSuccess, onClose]);

    return (
        <Modal isOpen={isOpen}
                onClose={onClose}
                title="Agregar marcador"
                subtitle="Guarda un nuevo enlace en tu archivo"
                icon="add_link"
                footer={
                    <>
                        <Button variant="ghost" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            form="bookmark-form"
                            rightIcon={
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                                    arrow_forward
                                </span>
                            }
                        >
                            Guardar marcador
                        </Button>
                    </>
                }>
            <BookmarkForm
                folders={folders}
                onSubmit={handleSubmit}
                isSubmitting={false}
            />
        </Modal>
    );
};