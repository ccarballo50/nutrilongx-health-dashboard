// api/hello.ts
export const config = { runtime: 'nodejs' };

export default function handler(_req: any, res: any) {
  res.status(200).send('ok');
}
