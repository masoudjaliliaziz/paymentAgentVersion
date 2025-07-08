type Props = {
  userRole: string | "agent" | "master";
};

function ActionByRole({ userRole }: Props) {
  return (
    <>
      {" "}
      {userRole === "agent" && (
        <button
          className="bg-purple-600 text-xs px-3 py-1.5 rounded-md font-semibold text-white  hover:bg-purple-800"
          type="submit"
        >
          اعلان وضعیت کارشناس
        </button>
      )}
      {userRole === "master" && (
        <button className="bg-orange-600 text-xs px-3 py-1.5 rounded-md font-semibold text-white  hover:bg-orange-800">
          اعلان وضعیت خزانه
        </button>
      )}
    </>
  );
}

export default ActionByRole;
