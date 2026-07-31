// pages/AdminCategoryDetailPageWrapper.tsx
import { useNavigate, useParams } from 'react-router-dom';
import { AdminCategoryDetailPage } from './AdminCategoryDetailPage';

export function AdminCategoryDetailPageWrapper() {
    const navigate = useNavigate();
    const { categoryId } = useParams<{ categoryId: string }>();

    return (
        <AdminCategoryDetailPage
            categoryParam={categoryId ?? ''}
            onBack={() => navigate('/admin/categorias')}
        />
    );
}