-- CreateEnum
CREATE TYPE "TipoControl" AS ENUM ('contable', 'estado');

-- CreateEnum
CREATE TYPE "EstadoEnvase" AS ENUM ('cerrado', 'abierto', 'terminado');

-- AlterTable
ALTER TABLE "Insumo" ADD COLUMN     "estado_envase" "EstadoEnvase",
ADD COLUMN     "fecha_apertura" TIMESTAMP(3),
ADD COLUMN     "tipo_control" "TipoControl" NOT NULL DEFAULT 'contable';

-- AlterTable
ALTER TABLE "historial_insumo" ALTER COLUMN "cantidad" DROP NOT NULL;