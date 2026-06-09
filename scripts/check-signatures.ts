import { PrismaClient } from "@prisma/client"
const p = new PrismaClient()
p.user
  .findMany({
    select: {
      id: true,
      nom: true,
      prenom: true,
      signature: true,
      signatureUpdatedAt: true,
    },
  })
  .then((users) => {
    const withSig = users.filter((u) => u.signature !== null)
    const withoutSig = users.length - withSig.length
    console.log(`Total utilisateurs        : ${users.length}`)
    console.log(`Avec signature renseignee : ${withSig.length}`)
    console.log(`Sans signature            : ${withoutSig}`)
    if (withSig.length > 0) {
      console.table(
        withSig.map((u) => ({
          id: u.id,
          nom: u.nom,
          prenom: u.prenom,
          signatureUpdatedAt: u.signatureUpdatedAt,
        }))
      )
    }
  })
  .finally(() => p.$disconnect())
