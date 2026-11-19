import { useState, type FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/shared/Icon'

export function SearchDialog() {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const navigate = useNavigate()

  function submit(event: FormEvent) {
    event.preventDefault()
    setOpen(false)
    void navigate({ to: '/', search: term.trim() ? { q: term.trim() } : {}, hash: 'catalogo' })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="flex size-10 items-center justify-center text-fg hover:text-accent" aria-label="Buscar NFTs">
          <Icon name="search" size={20} />
        </button>
      </DialogTrigger>
      <DialogContent className="top-[120px] translate-y-0 sm:max-w-[560px]">
        <DialogTitle>Explorar coleções</DialogTitle>
        <DialogDescription className="sr-only">Busque NFTs pelo nome ou coleção.</DialogDescription>
        <form onSubmit={submit} role="search" className="flex gap-2">
          <label htmlFor="header-search" className="sr-only">
            Buscar NFTs
          </label>
          <input
            id="header-search"
            type="search"
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Explorar coleções"
            className="h-10 flex-1 rounded-[2px] border border-border bg-transparent px-3 font-body14-regular--lh-20 text-fg placeholder:text-fg-subtle focus-visible:border-primary"
          />
          <Button type="submit">Buscar</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
