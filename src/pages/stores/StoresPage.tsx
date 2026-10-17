import PageHeader from '../../components/PageHeader'
import StoreDirectory from './StoreDirectory'
export default function StoresPage() {
  return (
    <>
      <PageHeader
        eyebrow="Platform directory"
        title="Stores"
        description="Store profiles, ownership, and status across your platform."
      />
      <StoreDirectory />
    </>
  )
}
