type Props = {
  title: string;
};
export function Error({ title }: Props) {
  return (
    <div className="w-8/12 rounded-lg font-black text-2xl bg-red-400 border-red-900 text-red-900 border-2 flex justify-center items-center py-5 px-1.5 ">
      {title}
    </div>
  );
}
