import { useCallback } from 'react';
import { Modal } from '@/components/ui/Modal/Modal';
import { BookmarkForm } from '@/components/BookmarkForm/BookmarkForm';
import { Button } from '@/components/ui/Button/Button';
import { Bookmark, Folder } from '@/types';
import { bookmarkService, UpdateBookmarkInput } from '@/services/bookmark.service';
import { useToastContext } from '@/context/ToastContext';

interface EditBookmarkModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookmark: Bookmark | null;
    folders: Folder[];
    onSuccess: () => void;
}

export const EditBookmarkModal = ({
    isOpen,
    onClose,
    bookmark,
    folders,
    onSuccess,
}: EditBookmarkModalProps) => {
    const toast = useToastContext();

    const handleSubmit = useCallback(async (values: {
        title: string;
        url: string;
        description: string;
        folderId: string;
        tags: string[];
    }) => {
        if (!bookmark) return;

        const input: UpdateBookmarkInput = {
            title: values.title,
            url: values.url,
            description: values.description || undefined,
            folderId: values.folderId || null,
            tagNames: values.tags,
        };

        await bookmarkService.update(bookmark.id, input);
        toast.success('Marcador actualizado correctamente');
        onSuccess();
        onClose();
    }, [bookmark, toast, onSuccess, onClose]);

    if (!bookmark) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Editar marcador"
            subtitle=""
            icon="edit"
            footer={
                <>
                <Button variant="ghost" onClick={onClose}>
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    form="bookmark-form"
                    leftIcon={
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                            save
                        </span>
                    }
                >
                    Guardar cambios
                </Button>
                </>
            }
        >
            <BookmarkForm
                initialValues={{
                    title: bookmark.title,
                    url: bookmark.url,
                    description: bookmark.description ?? '',
                    folderId: bookmark.folderId ?? '',
                    tags: bookmark.tags.map(bt => bt.tag.name),
                }}
                folders={folders}
                onSubmit={handleSubmit}
                isSubmitting={false}
                isEditing
            />
        </Modal>
    );
};