type Props = {
  title: string;
};
function Loading({ title }: Props) {
  return (
    <div className="w-8/12 rounded-lg font-black text-2xl bg-yellow-400 border-yellow-900 text-yellow-900 border-2 flex justify-center items-center py-5 px-1.5 ">
      {title}
    </div>
  );
}

export default Loading;
