export type IndicadorId = 'usuarios' | 'roles' | 'productos' | 'categorias' | 'unidadesMedida'

export interface IndicadorResumen {
  id: IndicadorId
  titulo: string
  valor: number
  contexto: string
}
